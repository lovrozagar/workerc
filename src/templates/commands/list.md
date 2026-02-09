---
name: workerc:list
description: List all progress files with status
allowed-tools:
  - Read
  - Glob
---

<objective>
List all progress files with their status.
</objective>

<process>

**Step 1: Read all progress files**

Read all `.claude/progress/*.md` files.

**Step 2: Display**

For each file, print one line (check in this order):
- `[DONE] {filename}: {line 1}` — if line 1 contains "[DONE]"
- `[ABORTED] {filename}: {line 1}` — if line 1 contains "[ABORTED]"
- `[ACTIVE] {filename}: {line 1}` — if line 2 has a non-empty session ID (not "pending")
- `[PAUSED] {filename}: {line 1}` — if file has a `## Handoff` section
- `[FREE] {filename}: {line 1}` — if line 2 has empty session, "pending", or no session tag

Print summary: "X active, Y paused, Z free, W done, V aborted"

STOP.

</process>
