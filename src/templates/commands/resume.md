---
name: workerc:resume
description: Resume an existing work session by claiming an unclaimed progress file
allowed-tools:
  - Read
  - Edit
  - Glob
  - AskUserQuestion
---

<objective>
Resume an existing work session. Finds unclaimed/pending progress files and lets the user pick one.
If none found, tells user to run /workerc:new instead.
</objective>

<process>

**Step 1: Find resumable progress files**

Read all `.claude/progress/*.md` files. Collect ones where:
- Line 1 does NOT contain "[DONE]" or "[ABORTED]"
- Line 2 has `<!-- session: pending -->` or `<!-- session:  -->` or no session tag

If none found:
- Print: "No unclaimed progress files found. Run /workerc:new to start fresh."
- STOP

**Step 2: Let user pick**

If only 1 unclaimed: skip the question, pick it automatically.

If multiple:
```
AskUserQuestion(
  header: "Resume",
  question: "Which one do you want to resume?",
  options: [list names from line 1],
  multiSelect: false
)
```

**Step 3: Claim and resume**

Set line 2 of chosen file to `<!-- session: pending -->` (hook auto-claims on first edit).

Print:
```
Resuming: {line 1}
Progress: .claude/progress/{filename}
```

Print the last 5 log entries.

If the file has a `## Handoff` section, print it in full — this is the previous session's context.

If it has a spec (line 3, not "None"):
- Read the spec file
- Re-read files listed in ## Files section
- Resume implementing — do NOT ask what to do

If no spec:
- STOP and wait for user's next message with instructions

</process>
