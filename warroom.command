#!/bin/zsh
cd '/Users/pavlosamoshko/New project/proofound'
export PATH="$PATH:$HOME/.local/bin:$(npm prefix -g)/bin"
claude 'War room mode: read WAR_ROOM.md, then IMPLEMENTATION_PLAN.md. You orchestrate, Codex CLI implements (already installed, authenticated, smoke-tested - invocation template in WAR_ROOM.md). Execute P0 tasks in order, full-auto per protocol. Begin with P0-0.'
