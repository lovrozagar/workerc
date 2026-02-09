#!/usr/bin/env node

import { resolve } from "node:path"
import { init } from "./init.js"

const args = process.argv.slice(2)
const command = args[0]

if (command === "init") {
  const projectDir = resolve(args[1] ?? ".")
  init(projectDir)
} else {
  console.log(`workerc — Claude Code session management

Usage:
  workerc init [dir]    Install commands, hooks, and settings

Options:
  dir                   Project directory (default: current)

Examples:
  npx workerc init
  npx workerc init ./my-project`)

  if (command && command !== "--help" && command !== "-h") {
    process.exit(1)
  }
}
