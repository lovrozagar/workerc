---
name: workerc:handoff
description: Pause work and write handoff notes for the next session
allowed-tools:
  - Read
  - Edit
  - Glob
  - AskUserQuestion
---

<objective>
Pause the current session with structured handoff notes so the next session can resume effectively.
Different from /workerc:done — this is "paused", not "finished".
</objective>

<process>

**Step 1: Find session progress file**

Read all `.claude/progress/*.md`. Find the one with `<!-- session: CURRENT_SESSION_ID -->` on line 2.

If none found: print "No active progress file for this session." and STOP.

**Step 2: Suggest commit if uncommitted changes**

If no `(commit)` log entry and tracked files have uncommitted changes:
- Print: "Tip: run /workerc:commit first to commit your work-in-progress."
- Continue anyway — this is a suggestion, not a block.

**Step 3: Gather handoff info**

Ask user:
```
AskUserQuestion(
  header: "Handoff",
  question: "Any notes for the next session? (blockers, gotchas, what's next)",
  options: [
    { label: "Auto-generate", description: "Summarize from progress log and files" },
    { label: "I'll write notes", description: "I'll describe what to hand off" }
  ],
  multiSelect: false
)
```

**If "Auto-generate":**
- Read the progress file's ## Log and ## Files
- Read the spec if one exists (line 3)
- Summarize: what was done (from log), what's left (from spec scope minus done items), any blockers apparent from log

**If "I'll write notes":**
- Wait for user input, use that as the handoff content

**Step 4: Write handoff to progress file**

Append to the progress file (before ## Files):
```
## Handoff
**Status:** Paused on {YYYY-MM-DD HH:MM}
**Done so far:** {1-2 sentence summary of completed work}
**Next steps:** {what to do next}
**Blockers:** {any blockers, or "None"}
**Notes:** {user notes or auto-generated context}
```

Add log entry: `- [ ] ({YYYY-MM-DD HH:MM}) (handoff) Session paused`

**Step 5: Unclaim session**

Update line 2: change session ID to empty `<!-- session:  -->`

**Step 6: Confirm**

Print:
```
Paused: {filename}
Session unclaimed. Run /workerc:resume to pick this back up.
```

STOP.

</process>
