import { existsSync } from "node:fs"
import { join } from "node:path"

export interface DetectedTool {
  name: string
  command: string
  extensions: string
}

export interface DetectionResult {
  linter: DetectedTool | undefined
  typeChecker: DetectedTool | undefined
}

const LINTER_CONFIGS: Array<{ patterns: string[]; tool: DetectedTool }> = [
  {
    patterns: ["biome.json", "biome.jsonc"],
    tool: {
      name: "biome",
      command: "npx biome check --write",
      extensions: "ts|tsx|js|jsx|json|css",
    },
  },
  {
    patterns: [
      "eslint.config.js",
      "eslint.config.mjs",
      "eslint.config.cjs",
      "eslint.config.ts",
      ".eslintrc",
      ".eslintrc.js",
      ".eslintrc.json",
      ".eslintrc.yml",
    ],
    tool: {
      name: "eslint",
      command: "npx eslint --fix",
      extensions: "ts|tsx|js|jsx",
    },
  },
]

const TYPE_CHECKER_CONFIGS: Array<{ patterns: string[]; tool: DetectedTool }> =
  [
    {
      patterns: ["tsconfig.json"],
      tool: {
        name: "tsc",
        command: "npx tsc --noEmit",
        extensions: "ts|tsx",
      },
    },
  ]

function findConfig(
  projectDir: string,
  patterns: string[]
): boolean {
  return patterns.some((p) => existsSync(join(projectDir, p)))
}

export function detect(projectDir: string): DetectionResult {
  let linter: DetectedTool | undefined
  for (const config of LINTER_CONFIGS) {
    if (findConfig(projectDir, config.patterns)) {
      linter = config.tool
      break
    }
  }

  let typeChecker: DetectedTool | undefined
  for (const config of TYPE_CHECKER_CONFIGS) {
    if (findConfig(projectDir, config.patterns)) {
      typeChecker = config.tool
      break
    }
  }

  return { linter, typeChecker }
}
