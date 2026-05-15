# Supabase MCP Setup Status

> This file is a technical setup and discovery note only.
> It is not the MVP source of truth for product scope or launch promises.
> Product scope precedence is `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`, then `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`, `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`, `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`, `Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md`, and fresh repo-grounded evidence. This document is implementation context only.

## Current Status

### MCP configuration

- Status: configured in `mcp-config.json`
- Connection target: Supabase MCP for project `cjpfrgmsxwxhuomnvciq`

### What this report is for

- confirming MCP connectivity
- recording schema discovery snapshots
- tracking Supabase advisor findings that affect local setup or database hygiene

### What this report is not for

- defining product scope
- defining canonical user or organization personas
- deciding what the MVP promises publicly

## Schema Discovery Snapshot

Recent MCP discovery confirms the repo is connected to a live Supabase project and can inspect:

- profile and organization tables
- assignment and matching tables
- skills, capabilities, evidence, and related proof tables
- audit and feature-flag tables

Treat this as operational visibility only. Schema presence does not mean every table or route is part of the active Project Specification launch contract.

## Current Issues Worth Tracking

### Security advisor

- leaked password protection was previously reported as disabled
- action: verify the current Supabase dashboard setting and enable it if still off

### Performance advisors

- unused indexes were previously reported across matching and evidence-related tables
- action: review with query evidence before removing anything

## Local Setup Reminders

- keep `.env.local` untracked
- use the Supabase dashboard for service-role and connection details
- restart the local dev server after env changes

## Recommended Use

Use Supabase MCP for:

- schema inspection
- security and performance advisor checks
- query debugging
- migration and policy review support

Do not use this file as a substitute for the Project Specification, PRD, or launch runbook when making scope decisions.
