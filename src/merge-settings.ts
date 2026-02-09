import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

/**
 * Identifies workerc-managed hooks by checking if the command path
 * contains one of our known script names.
 */
const WORKERC_HOOK_NAMES = [
  "session-start-compact.sh",
  "post-edit-tracker.sh",
  "post-edit-lint.sh",
  "post-edit-types.sh",
]

interface HookEntry {
  type: string
  command: string
}

interface HookGroup {
  matcher: string
  hooks: HookEntry[]
}

interface Settings {
  hooks?: {
    SessionStart?: HookGroup[]
    PostToolUse?: HookGroup[]
    [key: string]: HookGroup[] | undefined
  }
  [key: string]: unknown
}

function isWorkercHook(hook: HookEntry): boolean {
  return WORKERC_HOOK_NAMES.some((name) => hook.command.includes(name))
}

function isWorkercGroup(group: HookGroup): boolean {
  return group.hooks.every(isWorkercHook)
}

export type SettingsTarget = "local" | "shared"

export interface MergeOptions {
  projectDir: string
  target: SettingsTarget
  enableLint: boolean
  lintHookFilename: string
  enableTypes: boolean
  typesHookFilename: string
}

export function mergeSettings(options: MergeOptions): string {
  const filename = options.target === "shared"
    ? "settings.json"
    : "settings.local.json"
  const settingsPath = join(options.projectDir, ".claude", filename)
  const settingsDir = dirname(settingsPath)

  if (!existsSync(settingsDir)) {
    mkdirSync(settingsDir, { recursive: true })
  }

  let settings: Settings = {}
  if (existsSync(settingsPath)) {
    const raw = readFileSync(settingsPath, "utf-8")
    settings = JSON.parse(raw) as Settings
  }

  if (!settings.hooks) {
    settings.hooks = {}
  }

  /* SessionStart: keep non-workerc hooks, append compact */
  const existingSessionStart = (settings.hooks.SessionStart ?? []).filter(
    (g) => !isWorkercGroup(g)
  )
  const compactHook: HookGroup = {
    matcher: "compact",
    hooks: [
      {
        type: "command",
        command:
          '"$CLAUDE_PROJECT_DIR"/.claude/hooks/session-start-compact.sh',
      },
    ],
  }
  settings.hooks.SessionStart = [...existingSessionStart, compactHook]

  /* PostToolUse: keep non-workerc hooks, append workerc hooks */
  const existingPostToolUse = (settings.hooks.PostToolUse ?? []).filter(
    (g) => !isWorkercGroup(g)
  )

  const newPostToolUse: HookGroup[] = []

  if (options.enableLint) {
    newPostToolUse.push({
      matcher: "Write|Edit",
      hooks: [
        {
          type: "command",
          command: `"$CLAUDE_PROJECT_DIR"/.claude/hooks/${options.lintHookFilename}`,
        },
      ],
    })
  }

  if (options.enableTypes) {
    newPostToolUse.push({
      matcher: "Write|Edit",
      hooks: [
        {
          type: "command",
          command: `"$CLAUDE_PROJECT_DIR"/.claude/hooks/${options.typesHookFilename}`,
        },
      ],
    })
  }

  /* Tracker always goes last */
  newPostToolUse.push({
    matcher: "Write|Edit",
    hooks: [
      {
        type: "command",
        command:
          '"$CLAUDE_PROJECT_DIR"/.claude/hooks/post-edit-tracker.sh',
      },
    ],
  })

  settings.hooks.PostToolUse = [...existingPostToolUse, ...newPostToolUse]

  writeFileSync(settingsPath, JSON.stringify(settings, null, "\t") + "\n")
  return filename
}
