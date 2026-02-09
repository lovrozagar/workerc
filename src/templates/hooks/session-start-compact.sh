#!/bin/bash
# SessionStart hook: Re-inject tracker + spec context after compaction
# Fires on: compact (registered via matcher in settings.local.json)
# Output: additionalContext with tracker content, spec content, and action instructions

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')

[ -z "$SESSION_ID" ] && exit 0

TRACKER_DIR="$(cd "$(dirname "$0")/../progress" 2>/dev/null && pwd)"
[ -z "$TRACKER_DIR" ] || [ ! -d "$TRACKER_DIR" ] && exit 0

PROJECT_DIR="$(cd "$(dirname "$0")/../.." 2>/dev/null && pwd)"

# Find this session's active tracker
MY_TRACKER=""
for t in "$TRACKER_DIR"/*.md; do
	[ -f "$t" ] || continue
	LINE1=$(head -1 "$t")
	echo "$LINE1" | grep -q "\[DONE\]" && continue
	echo "$LINE1" | grep -q "\[ABORTED\]" && continue
	LINE2=$(sed -n '2p' "$t")
	if echo "$LINE2" | grep -q "<!-- session: $SESSION_ID -->"; then
		MY_TRACKER="$t"
		break
	fi
done

[ -z "$MY_TRACKER" ] && exit 0

# Read tracker
TRACKER_CONTENT=$(cat "$MY_TRACKER")
TRACKER_NAME=$(basename "$MY_TRACKER")
TRACKER_REL=".claude/progress/$TRACKER_NAME"

# Extract spec path (line 3 format: <!-- spec: path -->)
SPEC_PATH=""
SPEC_CONTENT=""
SPEC_LINE=$(sed -n '3p' "$MY_TRACKER")
if echo "$SPEC_LINE" | grep -q "<!-- spec:"; then
	SPEC_PATH=$(echo "$SPEC_LINE" | sed -n 's/<!-- spec: \(.*\) -->/\1/p')
fi

if [ -n "$SPEC_PATH" ] && [ "$SPEC_PATH" != "None" ]; then
	FULL_SPEC="$PROJECT_DIR/$SPEC_PATH"
	if [ -f "$FULL_SPEC" ]; then
		SPEC_CONTENT=$(cat "$FULL_SPEC")
	fi
fi

# Count completed entries to show progress
DONE_COUNT=$(grep -c '^\- \[x\]' "$MY_TRACKER" 2>/dev/null || echo "0")

# Build context
CONTEXT="# SESSION CONTEXT RESTORED (post-compaction)

You are CONTINUING an existing work session. You are NOT starting fresh.
Your session ID: $SESSION_ID

## Active Progress: $TRACKER_REL ($DONE_COUNT entries)
$TRACKER_CONTENT

## REQUIRED: After reading this, immediately:
1. Re-read your progress file: Read file $PROJECT_DIR/$TRACKER_REL"

if [ -n "$SPEC_PATH" ] && [ "$SPEC_PATH" != "None" ]; then
	CONTEXT="$CONTEXT
2. Re-read your spec: Read file $PROJECT_DIR/$SPEC_PATH"
fi

CONTEXT="$CONTEXT
3. Review the last few log entries to understand where you left off
4. Re-read files listed in ## Files to rebuild code context
5. Continue working — do NOT ask the user what to do next unless genuinely stuck

## Hooks still active:
{{ACTIVE_HOOKS}}"

if [ -n "$SPEC_CONTENT" ]; then
	CONTEXT="$CONTEXT

## Spec: $SPEC_PATH
$SPEC_CONTENT"
fi

jq -n --arg ctx "$CONTEXT" '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":$ctx}}'
exit 0
