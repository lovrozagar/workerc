---
name: workerc:scope
description: Update spec scope — add, remove, or mark items done
allowed-tools:
  - Read
  - Edit
  - Glob
  - AskUserQuestion
---

<objective>
Structured way to update the spec's scope mid-session. Keeps scope changes logged in progress.
</objective>

<process>

**Step 1: Find session progress file**

Read all `.claude/progress/*.md`. Find the one with `<!-- session: CURRENT_SESSION_ID -->` on line 2.

If none found: print "No active progress file for this session." and STOP.

**Step 2: Check for spec**

Read line 3 for spec path.

If spec is "None" or missing:
- Print: "No spec linked to this session. Nothing to update."
- STOP

**Step 3: Read and show current scope**

Read the spec file. Print the current `## Scope` section.

**Step 4: Ask what to do**

```
AskUserQuestion(
  header: "Scope",
  question: "What do you want to change?",
  options: [
    { label: "Add item", description: "Add something new to scope" },
    { label: "Remove item", description: "Descope something" },
    { label: "Mark done", description: "Strikethrough a completed item" }
  ],
  multiSelect: false
)
```

**If "Add item":**
- Ask: "What should be added to scope?"
- Wait for user input
- Append `- In: {user input}` to the `## Scope` section in the spec
- Log: `- [x] ({YYYY-MM-DD HH:MM}) (scope) Added to scope: {item}`

**If "Remove item":**
- Collect current "In:" items from spec
- Use AskUserQuestion with those items as options (label = item text, description = "Remove this from scope")
- Remove the chosen line from spec
- Log: `- [x] ({YYYY-MM-DD HH:MM}) (scope) Descoped: {item}`

**If "Mark done":**
- Collect current "In:" items that aren't struck through
- Use AskUserQuestion with those items as options (label = item text, description = "Mark as completed")
- Wrap chosen item text in ~~strikethrough~~
- Log: `- [x] ({YYYY-MM-DD HH:MM}) (scope) Completed: {item}`

**Step 5: Confirm**

Print updated `## Scope` section.

STOP.

</process>
