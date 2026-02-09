---
name: workerc:review
description: Review work against spec before marking done
allowed-tools:
  - Read
  - Glob
  - Grep
---

<objective>
Self-check: compare what was built against the spec. Reports coverage, does NOT auto-fix.
Run this before /workerc:done to catch gaps.
</objective>

<process>

**Step 1: Find session progress file**

Read all `.claude/progress/*.md`. Find the one with `<!-- session: CURRENT_SESSION_ID -->` on line 2.

If none found: print "No active progress file for this session." and STOP.

**Step 2: Check for spec**

Read line 3 for spec path.

If spec is "None" or missing:
- Print: "No spec linked. Showing work summary instead."
- Read all files listed in ## Files section
- Print a summary of what was built (1 line per file: filename + what changed)
- STOP

**Step 3: Read spec and progress**

Read the spec file fully.
Read the progress file fully.

**Step 4: Extract scope items**

From the spec's `## Scope` section (or `## Goal` if no Scope), extract each item.
Items with ~~strikethrough~~ = done in spec.

**Step 5: Verify each scope item**

For each scope item:
- Check if it appears done in the spec (strikethrough)
- Check if related work appears in the progress ## Log
- Read relevant files from ## Files to verify implementation exists

**Step 6: Print checklist**

Print:
```
## Review: {progress filename}
Spec: {spec path}

| Status | Scope Item |
|--------|-----------|
| done | {item that's verified} |
| missing | {item with no evidence of implementation} |
| partial | {item with some but incomplete evidence} |

Summary: X/Y scope items done, Z missing, W partial
```

If any items are "missing" or "partial":
- Print: "Run /workerc:done only after addressing gaps — or update spec to descope."

If all done:
- Print: "All scope items covered. Safe to run /workerc:done."

**Step 7: Check spec completeness**

Check if the spec has content in these sections:
- `## Decisions` — empty?
- `## Discovered` — empty?
- `## Rejected` — empty?

If ALL three are empty:
- Print: "Spec hygiene: Decisions, Discovered, and Rejected are all empty. Consider documenting any choices made or things learned during this work."

If only some are empty, skip — not every session has rejections or discoveries.

STOP.

</process>
