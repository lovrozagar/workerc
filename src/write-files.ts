import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

export interface WriteOptions {
  projectDir: string
  enableLint: boolean
  lintCommand: string
  lintExtensions: string
  lintHookFilename: string
  enableTypes: boolean
  typeCommand: string
  typeExtensions: string
  typesHookFilename: string
  activeHooksDescription: string
}

function getTemplateDir(): string {
  const thisFile = fileURLToPath(import.meta.url)
  /* In dist/write-files.js → templates are in dist/templates/ */
  const dir = join(thisFile, "..", "templates")
  if (existsSync(dir)) return dir
  /* Fallback: src layout (dev) */
  return join(thisFile, "..", "..", "src", "templates")
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

function renderTemplate(
  content: string,
  vars: Record<string, string>
): string {
  let result = content
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{{${key}}}}`, value)
    result = result.replaceAll(`{{${key}}}`, value)
  }
  return result
}

export function writeFiles(options: WriteOptions): {
  commands: string[]
  hooks: string[]
} {
  const templateDir = getTemplateDir()
  const claudeDir = join(options.projectDir, ".claude")
  const commandsTarget = join(claudeDir, "commands", "workerc")
  const hooksTarget = join(claudeDir, "hooks")
  const progressDir = join(claudeDir, "progress")

  ensureDir(commandsTarget)
  ensureDir(hooksTarget)
  ensureDir(progressDir)

  /* Copy command templates verbatim */
  const commandsSrc = join(templateDir, "commands")
  const commandFiles = readdirSync(commandsSrc).filter((f) =>
    f.endsWith(".md")
  )
  for (const file of commandFiles) {
    cpSync(join(commandsSrc, file), join(commandsTarget, file))
  }

  /* Copy/template hook files */
  const writtenHooks: string[] = []

  /* Tracker — verbatim copy */
  cpSync(
    join(templateDir, "hooks", "post-edit-tracker.sh"),
    join(hooksTarget, "post-edit-tracker.sh")
  )
  chmodSync(join(hooksTarget, "post-edit-tracker.sh"), 0o755)
  writtenHooks.push("post-edit-tracker.sh")

  /* Session start compact — template {{ACTIVE_HOOKS}} */
  const compactSrc = readFileSync(
    join(templateDir, "hooks", "session-start-compact.sh"),
    "utf-8"
  )
  const compactRendered = renderTemplate(compactSrc, {
    ACTIVE_HOOKS: options.activeHooksDescription,
  })
  writeFileSync(
    join(hooksTarget, "session-start-compact.sh"),
    compactRendered
  )
  chmodSync(join(hooksTarget, "session-start-compact.sh"), 0o755)
  writtenHooks.push("session-start-compact.sh")

  /* Lint hook — optional, from template */
  if (options.enableLint) {
    const lintTmpl = readFileSync(
      join(templateDir, "hooks", "post-edit-lint.sh.tmpl"),
      "utf-8"
    )
    const lintRendered = renderTemplate(lintTmpl, {
      LINT_COMMAND: options.lintCommand,
      EXTENSIONS: options.lintExtensions,
    })
    writeFileSync(join(hooksTarget, options.lintHookFilename), lintRendered)
    chmodSync(join(hooksTarget, options.lintHookFilename), 0o755)
    writtenHooks.push(options.lintHookFilename)
  }

  /* Types hook — optional, from template */
  if (options.enableTypes) {
    const typesTmpl = readFileSync(
      join(templateDir, "hooks", "post-edit-types.sh.tmpl"),
      "utf-8"
    )
    const typesRendered = renderTemplate(typesTmpl, {
      TYPE_COMMAND: options.typeCommand,
      EXTENSIONS: options.typeExtensions,
    })
    writeFileSync(
      join(hooksTarget, options.typesHookFilename),
      typesRendered
    )
    chmodSync(join(hooksTarget, options.typesHookFilename), 0o755)
    writtenHooks.push(options.typesHookFilename)
  }

  return { commands: commandFiles, hooks: writtenHooks }
}
