# workerc

Claude Code session management — commands, hooks, and progress tracking.

workerc adds structured session workflows to any project using [Claude Code](https://docs.anthropic.com/en/docs/claude-code). It installs slash commands for managing work sessions, hooks that enforce progress tracking and code quality, and a progress file system that persists context across sessions.

## Install

```bash
npx @scriptgun/workerc init
```

This interactively sets up:

- **10 slash commands** in `.claude/commands/workerc/`
- **Hooks** in `.claude/hooks/` (tracker + optional lint/type check)
- **Settings** in `.claude/settings.local.json`
- **Progress directory** at `.claude/progress/`

## Commands

| Command | Description |
|---------|-------------|
| `/workerc:new` | Start a new work session with optional spec |
| `/workerc:resume` | Resume an unclaimed session |
| `/workerc:status` | Show current session progress |
| `/workerc:list` | List all progress files with status |
| `/workerc:scope` | Update spec scope mid-session |
| `/workerc:commit` | Stage and commit with auto-generated message |
| `/workerc:review` | Review work against spec |
| `/workerc:handoff` | Pause session with handoff notes |
| `/workerc:done` | Mark session complete |
| `/workerc:abort` | Abandon session |

## Hooks

### Always installed

- **post-edit-tracker.sh** — Blocks edits if no progress file is active. Auto-claims pending sessions on first edit. Auto-tracks edited files. Enforces 15s freshness (agent must update progress regularly).
- **session-start-compact.sh** — Re-injects session context after Claude compacts the conversation. Restores progress file, spec, and file list so the agent can continue seamlessly.

### Optional (auto-detected)

- **post-edit-lint.sh** — Runs linter on every file edit. Detected tools: Biome, ESLint.
- **post-edit-types.sh** — Runs type checker on every file edit. Detected tools: TypeScript (`tsc`).

## How it works

1. Run `/workerc:new` to start a session — creates a progress file in `.claude/progress/`
2. The tracker hook auto-claims the session on your first file edit
3. As you work, the tracker logs edited files and enforces regular progress updates
4. Use `/workerc:commit` to commit, `/workerc:review` to check against spec
5. Use `/workerc:handoff` to pause or `/workerc:done` to complete

Progress files persist across sessions — use `/workerc:resume` to pick up where you left off.

## Re-running init

`workerc init` is idempotent. Running it again updates all commands and hooks without duplicating settings entries.

## License

MIT
