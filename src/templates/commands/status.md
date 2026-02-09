---
name: workerc:status
description: Show current session progress
allowed-tools:
  - Read
  - Glob
---

<objective>
Show the current session's progress file. No analysis, no suggestions.
</objective>

<process>

**Step 1: Find session progress file**

Read all `.claude/progress/*.md`. Find the one with `<!-- session: CURRENT_SESSION_ID -->` on line 2.

If none found: print "No active progress file for this session. Run /workerc:new to start." and STOP.

**Step 2: Display**

Print the full progress file contents.

If there's a spec link (line 3, not "None"):
- Print "Spec: {path}"

STOP.

</process>
