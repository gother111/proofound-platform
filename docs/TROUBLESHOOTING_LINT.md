# Lint Troubleshooting

> Doc Class: `active`
> Last Verified: `2026-05-19`

`npm run lint` runs `scripts/lint-or-skip.js`, which invokes ESLint through `npx eslint . --ext .js,.jsx,.ts,.tsx` when local dependencies are present.

## Lint Skips Instead Of Running

If dependencies are not installed, the wrapper prints:

```
Skipping lint: eslint is not installed in this environment.
```

Install dependencies with the lockfile workflow from the repository root:

```bash
npm ci
```

Then rerun:

```bash
npm run lint
```

For launch or merge evidence, ensure lint actually ran. Do not count a dependency-missing skip as a passing lint gate.

## Wrong Node Version

This repo targets Node `24.15.0` and uses `.npmrc` with `engine-strict=true`. If install or lint fails because the Node version is unsupported, switch to the repo version:

```bash
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm install
nvm use
npm ci
npm run lint
```

## Registry Or Auth Failures

If `npm ci` fails with messages such as `403 Forbidden - GET https://registry.npmjs.org/...`, the registry is denying access to one or more packages. Provide the appropriate npm authentication or run the install from an environment that already has access to the required registry mirror. Do not commit registry tokens or secret `.npmrc` values.

## Forcing The Lint Attempt

`FORCE_LINT=true npm run lint` bypasses the dependency-presence skip and attempts to run ESLint anyway. Use it only when you intentionally want a hard failure in a restricted environment; it does not install missing dependencies.
