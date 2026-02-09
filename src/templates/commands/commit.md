---
name: workerc:commit
description: Commit tracked files with auto-generated conventional commit message
allowed-tools:
  - Read
  - Glob
  - Bash
  - AskUserQuestion
---

<objective>
Stage and commit files from the current session's progress file.
Auto-generates conventional commit message from progress context.
NEVER add Co-Authored-By, AI attribution, or any footer to the commit message.
</objective>

<process>

**Step 1: Find session progress file**

Read all `.claude/progress/*.md`. Find the one with `<!-- session: CURRENT_SESSION_ID -->` on line 2.

If none found: print "No active progress file for this session." and STOP.

**Step 2: Read progress and spec**

Read the full progress file.
Read spec if one exists (line 3, not "None").

**Step 3: Check git status**

Run `git status --short` and `git diff --stat`.

Get the list of files from `## Files` section.

For each file in ## Files, check if it has uncommitted changes (modified, untracked, or staged).
Collect only files that actually have changes — skip files already committed or unchanged.

If no files have changes:
- Print: "No uncommitted changes in tracked files."
- STOP

**Step 4: Ask what to stage**

```
AskUserQuestion(
  header: "Stage",
  question: "Which files to commit?",
  options: [
    { label: "Tracked files", description: "Only files listed in ## Files that have changes" },
    { label: "Let me pick", description: "I'll tell you which files" }
  ],
  multiSelect: false
)
```

**If "Tracked files":** stage all changed files from ## Files.
**If "Let me pick":** wait for user input, stage only those files.

Run `git add` for the selected files. Do NOT use `git add -A` or `git add .`.

**Step 5: Generate commit message**

**Prefix** — infer from log entries and file types:
- `fix` if log contains: fix, bug, broken, patch, repair, resolve
- `feat` if log contains: add, create, implement, new, feature
- `refactor` if log contains: refactor, move, rename, extract, reorganize
- `test` if log contains: test
- `docs` if only .md files changed
- `chore` if only config/tooling files changed
- `style` if log contains: style, css, theme, layout
- fallback: `feat`

**Scope** — infer from file paths:
- If spec exists: use spec filename slug (e.g. `auth-refactor` from `auth-refactor.md`)
- Else if all files share a common parent dir: use that dir name
- Else: use first meaningful directory from ## Files
- Keep scope short (1-2 words, no path separators)

**Message** — from progress file line 1:
- Take the work name, lowercase it
- Remove "Progress for" prefix and date suffix
- Keep it under 50 chars total (with prefix and scope)

**Body** — from last 5 log entries:
- Extract the description part (after the timestamp and scope)
- Format as bullet points with `-`
- NEVER add Co-Authored-By lines
- NEVER add AI attribution or generated-by footers
- NEVER add any trailer lines
- Body is ONLY the bullet points from the log

Full format:
```
{prefix}({scope}): {message}

{body bullet points}
```

**Step 6: Preview and confirm**

Print the full draft commit message in a code block.
Print the list of files that will be committed.

```
AskUserQuestion(
  header: "Commit",
  question: "How does this look?",
  options: [
    { label: "Commit as-is", description: "Use this exact message" },
    { label: "Edit", description: "I'll adjust the message" }
  ],
  multiSelect: false
)
```

**If "Edit":** wait for user to provide corrected message, use that instead.
**If "Commit as-is":** proceed with the generated message.

**Step 7: Commit**

Run `git commit` with the final message. Use HEREDOC format:
```bash
git commit -m "$(cat <<'EOF'
{final message here — NO Co-Authored-By, NO trailers}
EOF
)"
```

IMPORTANT: The commit message must contain ONLY the prefix/scope/message and body bullets. Nothing else. No signatures, no attribution, no footers.

**Step 8: Log the commit**

Get the short hash with `git rev-parse --short HEAD`.
Add to progress log: `- [x] ({YYYY-MM-DD HH:MM}) (commit) {short_hash}: {prefix}({scope}): {message}`

Print:
```
Committed: {short_hash}
{prefix}({scope}): {message}
```

STOP.

</process>
