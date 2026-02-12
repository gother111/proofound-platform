#!/usr/bin/env python3
"""
Sync selected keys from .env.local into a Vercel project's environment variables.

Safety:
- Never prints values (only key names and high level status).
- Defaults to syncing to production + preview.

Requires:
- VERCEL_TOKEN in env (or --token)
- Vercel projectId/teamId (via args or .vercel/project.json)
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import subprocess
import urllib.error
import urllib.request


VERCEL_API_BASE = "https://api.vercel.com"


def _read_json(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _parse_env_file(path: str) -> dict[str, str]:
    """
    Minimal .env parser:
    - ignores blank lines and comments
    - parses KEY=VALUE
    - strips surrounding single/double quotes from VALUE
    """
    out: dict[str, str] = {}
    with open(path, "r", encoding="utf-8") as f:
        for raw in f:
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                continue
            key, val = line.split("=", 1)
            key = key.strip()
            val = val.strip()
            if not key:
                continue
            if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                val = val[1:-1]
            out[key] = val
    return out


def _http_json(method: str, url: str, token: str, payload: dict | None = None) -> dict | list | None:
    """
    Use curl for HTTPS requests to avoid local Python SSL CA issues.
    Never prints payload values.
    """
    cmd = [
        "curl",
        "-fsS",
        "-X",
        method,
        "-H",
        f"Authorization: Bearer {token}",
        "-H",
        "Accept: application/json",
    ]
    if payload is not None:
        cmd += ["-H", "Content-Type: application/json", "--data-binary", json.dumps(payload)]
    cmd.append(url)

    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        # stderr does not include secret values; payload is not echoed.
        raise RuntimeError(f"curl failed: {method} {url}: {proc.stderr.strip()}")

    body = (proc.stdout or "").strip()
    if not body:
        return None
    return json.loads(body)


def _infer_project_context(args: argparse.Namespace) -> tuple[str, str]:
    if args.project_id and args.team_id:
        return args.project_id, args.team_id

    # Best effort: read .vercel/project.json if present (gitignored).
    try:
        pj = _read_json(".vercel/project.json")
        project_id = args.project_id or pj.get("projectId")
        team_id = args.team_id or pj.get("orgId")
        if project_id and team_id:
            return project_id, team_id
    except FileNotFoundError:
        pass

    missing = []
    if not args.project_id:
        missing.append("--project-id")
    if not args.team_id:
        missing.append("--team-id")
    raise SystemExit(f"Missing required context: {', '.join(missing)} (or link the repo via Vercel CLI).")


def _list_envs(project_id: str, team_id: str, token: str) -> list[dict]:
    url = f"{VERCEL_API_BASE}/v10/projects/{project_id}/env?teamId={team_id}"
    res = _http_json("GET", url, token)
    if isinstance(res, dict) and isinstance(res.get("envs"), list):
        return res["envs"]
    if isinstance(res, list):
        return res
    return []


def _delete_env(project_id: str, env_id: str, team_id: str, token: str) -> None:
    url = f"{VERCEL_API_BASE}/v10/projects/{project_id}/env/{env_id}?teamId={team_id}"
    _http_json("DELETE", url, token)


def _create_env(
    project_id: str,
    team_id: str,
    token: str,
    *,
    key: str,
    value: str,
    env_type: str,
    targets: list[str],
) -> None:
    url = f"{VERCEL_API_BASE}/v10/projects/{project_id}/env?teamId={team_id}"
    payload = {
        "key": key,
        "value": value,
        "type": env_type,
        "target": targets,
    }
    _http_json("POST", url, token, payload)


def main() -> int:
    ap = argparse.ArgumentParser(description="Sync selected .env.local keys to a Vercel project.")
    ap.add_argument("--env-file", default=".env.local", help="Path to env file (default: .env.local)")
    ap.add_argument("--project-id", help="Vercel projectId (optional if .vercel/project.json exists)")
    ap.add_argument("--team-id", help="Vercel team/org id (optional if .vercel/project.json exists)")
    ap.add_argument("--token", default=os.environ.get("VERCEL_TOKEN"), help="Vercel token (default: $VERCEL_TOKEN)")
    ap.add_argument(
        "--targets",
        default="production,preview",
        help="Comma-separated targets (default: production,preview)",
    )
    ap.add_argument("--dry-run", action="store_true", help="Print planned keys without changing Vercel")
    args = ap.parse_args()

    if not args.token:
        raise SystemExit("Missing Vercel token: set VERCEL_TOKEN or pass --token.")

    project_id, team_id = _infer_project_context(args)
    env = _parse_env_file(args.env_file)

    targets = [t.strip() for t in args.targets.split(",") if t.strip()]
    if not targets:
        raise SystemExit("No targets specified.")

    required = [
        "DATABASE_URL",
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "NEXT_PUBLIC_SITE_URL",
        "CRON_SECRET",
        "RESEND_API_KEY",
    ]
    optional = [
        "DIRECT_URL",
        "NEXT_PUBLIC_APP_ENV",
        "NEXT_PUBLIC_URL",
        "EMAIL_FROM",
        "ZOOM_CLIENT_ID",
        "ZOOM_CLIENT_SECRET",
        "ZOOM_REDIRECT_URI",
        "GOOGLE_CLIENT_ID",
        "GOOGLE_CLIENT_SECRET",
        "GOOGLE_REDIRECT_URI",
        "NEXT_PUBLIC_SENTRY_DSN",
        "SENTRY_DSN",
        "SENTRY_AUTH_TOKEN",
    ]

    secrets = {
        "DATABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "CRON_SECRET",
        "RESEND_API_KEY",
        "ZOOM_CLIENT_SECRET",
        "GOOGLE_CLIENT_SECRET",
        "SENTRY_AUTH_TOKEN",
    }

    missing_required = [k for k in required if not env.get(k)]
    if missing_required:
        raise SystemExit(f"Missing required keys in {args.env_file}: {', '.join(missing_required)}")

    selected: list[str] = []
    for k in required + optional:
        if env.get(k):
            selected.append(k)

    print(f"project_id={project_id} team_id={team_id}")
    print(f"targets={','.join(targets)}")
    print(f"keys_to_sync={len(selected)}")

    if args.dry_run:
        for k in selected:
            kind = "encrypted" if k in secrets else "plain"
            print(f"DRY_RUN {k} type={kind}")
        return 0

    existing = _list_envs(project_id, team_id, args.token)

    # Delete any env var entries matching the key and overlapping targets.
    # Vercel represents targets as an array under "target".
    for k in selected:
        for ev in existing:
            if ev.get("key") != k:
                continue
            ev_targets = ev.get("target") or []
            if isinstance(ev_targets, str):
                ev_targets = [ev_targets]
            if not any(t in targets for t in ev_targets):
                continue
            env_id = ev.get("id")
            if env_id:
                print(f"DELETE {k}")
                _delete_env(project_id, env_id, team_id, args.token)

        env_type = "encrypted" if k in secrets else "plain"
        print(f"UPSERT {k} type={env_type}")
        _create_env(
            project_id,
            team_id,
            args.token,
            key=k,
            value=env[k],
            env_type=env_type,
            targets=targets,
        )

    # Confirm
    updated = _list_envs(project_id, team_id, args.token)
    present = sorted({ev.get("key") for ev in updated if ev.get("key") in selected})
    print(f"synced_present={len(present)}")
    for k in present:
        print(f"PRESENT {k}")

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        raise SystemExit(130)
