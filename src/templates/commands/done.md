---
name: workerc:done
description: Mark current session progress as complete and unclaim
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
---

<objective>
Mark the current session's progress file as complete. Unclaim it so it becomes a historical record.
</objective>

<process>

**Step 1: Find session progress file**

Read all `.claude/progress/*.md`. Find the one with `<!-- session: CURRENT_SESSION_ID -->` on line 2.

If none found: print "No active progress file for this session." and STOP.

**Step 2: Pre-done suggestions**

Check progress log and git status:
- If spec exists (line 3, not "None") and no `(review)` log entry: print "Tip: run /workerc:review first to verify spec coverage."
- If no `(commit)` log entry and tracked files have uncommitted changes: print "Tip: run /workerc:commit first to commit your changes."
- Continue anyway — these are suggestions, not blocks.

**Step 3: Mark complete**

- Update line 1: append " [DONE]" to the description
- Update line 2: change session ID to empty `<!-- session:  -->`
- Add final log entry: `- [x] ({YYYY-MM-DD HH:MM}) (done) Session complete`

**Step 4: Confirm**

Print:
```
Complete: {filename}
Session unclaimed. This is now a historical record.
```

STOP.

</process>
