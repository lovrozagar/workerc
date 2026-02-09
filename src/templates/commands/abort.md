---
name: workerc:abort
description: Abandon current work and mark progress as aborted
allowed-tools:
  - Read
  - Edit
  - Glob
  - AskUserQuestion
---

<objective>
Mark the current session's work as abandoned. Different from done (finished) and handoff (paused).
Use when: wrong approach, spec changed, work no longer needed.
</objective>

<process>

**Step 1: Find session progress file**

Read all `.claude/progress/*.md`. Find the one with `<!-- session: CURRENT_SESSION_ID -->` on line 2.

If none found: print "No active progress file for this session." and STOP.

**Step 2: Get reason**

Ask user:
```
AskUserQuestion(
  header: "Reason",
  question: "Why is this work being abandoned?",
  options: [
    { label: "Wrong approach", description: "The approach didn't work out" },
    { label: "No longer needed", description: "Requirements changed or feature dropped" },
    { label: "Blocked", description: "Can't proceed due to external dependency" }
  ],
  multiSelect: false
)
```

**Step 3: Update progress file**

- Update line 1: append " [ABORTED]"
- Update line 2: change session ID to empty `<!-- session:  -->`
- Add log entry: `- [ ] ({YYYY-MM-DD HH:MM}) (abort) Abandoned: {reason}`

**Step 4: Update spec if exists**

Read line 3 for spec path. If spec exists (not "None"):
- Read the spec file
- Append to `## Rejected` section: `- {YYYY-MM-DD}: Aborted — {reason}`

**Step 5: Confirm**

Print:
```
Aborted: {filename}
Reason: {reason}
Session unclaimed. Progress kept as historical record.
```

STOP.

</process>
