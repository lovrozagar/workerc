---
name: workerc:new
description: Start a new work session with progress file and optional spec
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Bash
  - AskUserQuestion
---

<objective>
Start a NEW work session. Always creates a fresh progress file.
The hook auto-claims "pending" progress files on first source file edit.
</objective>

<process>

**Step 1: Spec question**

Ask user:
```
AskUserQuestion(
  header: "Spec",
  question: "Do you have a written spec for this work?",
  options: [
    { label: "Yes, I'll give the path", description: "Link existing spec file" },
    { label: "No, create one", description: "I'll describe what I'm building" },
    { label: "No spec needed", description: "Skip straight to work" }
  ],
  multiSelect: false
)
```

**If "Yes, I'll give the path":**
- Ask for the path
- Validate file exists
- Store path as SPEC_PATH

**If "No, create one":**
- Ask: "What are you building?" and "What's in scope? What's out?" in a single AskUserQuestion with 2 questions
- Write spec to `.claude/specs/{slug}.md`:
  ```
  # {Title}
  ## Goal
  {user's description}
  ## Scope
  - In: {in scope items}
  - Out: {out of scope items}
  ## Decisions
  ## Discovered
  ## Rejected
  ```
- Store path as SPEC_PATH

**If "No spec needed":**
- SPEC_PATH = "None"

**Step 2: Create progress file**

Ask user:
```
AskUserQuestion(
  header: "Name",
  question: "Short name for this work? (used for filename, e.g. 'auth-refactor')",
  options: [
    { label: "Suggest from spec", description: "Auto-generate from spec/description" }
  ],
  multiSelect: false
)
```

Generate slug from name (lowercase, hyphens, max 40 chars).

If `.claude/progress/{slug}.md` already exists, append `-2` (or `-3`, etc.) to make it unique.

Write `.claude/progress/{slug}.md`:
```
Progress for {name} created on {YYYY-MM-DD}
<!-- session: pending -->
<!-- spec: {SPEC_PATH or None} -->

## Log

## Files
```

The hook will auto-claim this with the real session ID on the first source file edit.

**Step 3: Confirm and start**

Print:
```
Session started: {name}
Progress: .claude/progress/{slug}.md
Spec: {SPEC_PATH or None}
```

**If a spec exists (SPEC_PATH is not "None"):**
- Read the spec file
- Start implementing immediately — the spec IS the instructions
- Do NOT ask "what do you want to do?"

**If no spec:**
- STOP and wait for user's next message with instructions

</process>
