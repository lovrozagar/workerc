import * as p from "@clack/prompts"
import { detect } from "./detect.js"
import { mergeSettings } from "./merge-settings.js"
import { writeFiles } from "./write-files.js"

export async function init(projectDir: string): Promise<void> {
  p.intro("workerc init")

  /* Step 1: Detect tools */
  const spinner = p.spinner()
  spinner.start("Detecting project tools")
  const detected = detect(projectDir)
  spinner.stop("Detection complete")

  if (detected.linter) {
    p.log.info(`Found linter: ${detected.linter.name}`)
  }
  if (detected.typeChecker) {
    p.log.info(`Found type checker: ${detected.typeChecker.name}`)
  }
  if (!detected.linter && !detected.typeChecker) {
    p.log.info("No linter or type checker detected")
  }

  /* Step 2: Lint hook */
  let enableLint = false
  let lintCommand = ""
  let lintExtensions = ""
  const lintHookFilename = "post-edit-lint.sh"

  if (detected.linter) {
    const lintAnswer = await p.confirm({
      message: `Enable lint hook? (${detected.linter.name}: ${detected.linter.command})`,
      initialValue: true,
    })
    if (p.isCancel(lintAnswer)) {
      p.cancel("Cancelled")
      process.exit(0)
    }
    enableLint = lintAnswer

    if (enableLint) {
      const cmdAnswer = await p.text({
        message: "Lint command (file path appended automatically):",
        initialValue: detected.linter.command,
      })
      if (p.isCancel(cmdAnswer)) {
        p.cancel("Cancelled")
        process.exit(0)
      }
      lintCommand = cmdAnswer

      const extAnswer = await p.text({
        message: "File extensions to check (pipe-separated):",
        initialValue: detected.linter.extensions,
      })
      if (p.isCancel(extAnswer)) {
        p.cancel("Cancelled")
        process.exit(0)
      }
      lintExtensions = extAnswer
    }
  }

  /* Step 3: Type check hook */
  let enableTypes = false
  let typeCommand = ""
  let typeExtensions = ""
  const typesHookFilename = "post-edit-types.sh"

  if (detected.typeChecker) {
    const typesAnswer = await p.confirm({
      message: `Enable type check hook? (${detected.typeChecker.name}: ${detected.typeChecker.command})`,
      initialValue: true,
    })
    if (p.isCancel(typesAnswer)) {
      p.cancel("Cancelled")
      process.exit(0)
    }
    enableTypes = typesAnswer

    if (enableTypes) {
      const cmdAnswer = await p.text({
        message: "Type check command:",
        initialValue: detected.typeChecker.command,
      })
      if (p.isCancel(cmdAnswer)) {
        p.cancel("Cancelled")
        process.exit(0)
      }
      typeCommand = cmdAnswer

      const extAnswer = await p.text({
        message: "File extensions to check (pipe-separated):",
        initialValue: detected.typeChecker.extensions,
      })
      if (p.isCancel(extAnswer)) {
        p.cancel("Cancelled")
        process.exit(0)
      }
      typeExtensions = extAnswer
    }
  }

  /* Step 4: Build active hooks description for compact hook */
  const hookDescriptions: string[] = []
  if (enableLint) {
    hookDescriptions.push(
      `- ${lintHookFilename} (blocks on lint/format errors)`
    )
  }
  if (enableTypes) {
    hookDescriptions.push(
      `- ${typesHookFilename} (blocks on type errors)`
    )
  }
  hookDescriptions.push(
    "- post-edit-tracker.sh (blocks if progress not updated within 15s)"
  )
  const activeHooksDescription = hookDescriptions.join("\n")

  /* Step 5: Write files */
  spinner.start("Writing files")
  const result = writeFiles({
    projectDir,
    enableLint,
    lintCommand,
    lintExtensions,
    lintHookFilename,
    enableTypes,
    typeCommand,
    typeExtensions,
    typesHookFilename,
    activeHooksDescription,
  })
  spinner.stop("Files written")

  /* Step 6: Merge settings */
  spinner.start("Updating settings")
  mergeSettings({
    projectDir,
    enableLint,
    lintHookFilename,
    enableTypes,
    typesHookFilename,
  })
  spinner.stop("Settings updated")

  /* Step 7: Summary */
  p.log.success("workerc installed")
  p.log.message(
    [
      "",
      "Commands (10):",
      ...result.commands.map((f) => `  .claude/commands/workerc/${f}`),
      "",
      "Hooks:",
      ...result.hooks.map((f) => `  .claude/hooks/${f}`),
      "",
      "Settings: .claude/settings.local.json",
      "Progress: .claude/progress/",
      "",
      "Get started: run /workerc:new in Claude Code",
    ].join("\n")
  )

  p.outro("done")
}
