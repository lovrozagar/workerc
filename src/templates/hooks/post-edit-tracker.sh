#!/bin/bash
# Post-edit hook: Tracker enforcement (session-scoped)
# Always exit 0, use JSON {"decision":"block","reason":"..."} to report errors
#
# Logic:
# 1. Find tracker claimed by this session → check 15s freshness
# 2. Find "pending" tracker (from /workerc:new) → auto-claim it with real session ID
# 3. No tracker found → block, tell agent to create/claim one
#
# Subagents share parent session_id — parent's tracker covers them

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')

[ -z "$FILE" ] && exit 0
[ ! -f "$FILE" ] && exit 0
[ -z "$SESSION_ID" ] && exit 0

# Skip entire .claude directory
echo "$FILE" | grep -qE '/\.claude/' && exit 0

TRACKER_DIR="$(cd "$(dirname "$0")/../progress" 2>/dev/null && pwd)"

# No progress dir = block
if [ -z "$TRACKER_DIR" ] || [ ! -d "$TRACKER_DIR" ]; then
	jq -n --arg reason "No .claude/progress/ directory found. Run /workerc:new to create one." '{"decision":"block","reason":$reason}'
	exit 0
fi

# Scan all trackers
NOW=$(date +%s)
MY_TRACKER=""
MY_TRACKER_AGE=""
PENDING_TRACKER=""
UNCLAIMED=""

for t in "$TRACKER_DIR"/*.md; do
	[ -f "$t" ] || continue
	LINE1=$(head -1 "$t")

	# Skip done/aborted trackers
	echo "$LINE1" | grep -q "\[DONE\]" && continue
	echo "$LINE1" | grep -q "\[ABORTED\]" && continue

	LINE2=$(sed -n '2p' "$t")

	# Already claimed by this session
	if echo "$LINE2" | grep -q "<!-- session: $SESSION_ID -->"; then
		MY_TRACKER="$t"
		MOD=$(stat -f %m "$t" 2>/dev/null || stat -c %Y "$t" 2>/dev/null)
		MY_TRACKER_AGE=$((NOW - MOD))
		break
	fi

	# Pending tracker (from /workerc:new)
	if echo "$LINE2" | grep -q "<!-- session: pending -->"; then
		if [ -z "$PENDING_TRACKER" ]; then
			PENDING_TRACKER="$t"
		else
			# Multiple pending — can't auto-claim safely
			PENDING_TRACKER="AMBIGUOUS"
		fi
		continue
	fi

	# Unclaimed (empty session or no session tag)
	if echo "$LINE2" | grep -q "<!-- session:  -->" || ! echo "$LINE2" | grep -q "<!-- session:"; then
		UNCLAIMED="$UNCLAIMED
  $(basename "$t"): $LINE1"
	fi
done

# Case 1: Already claimed by this session — check freshness + auto-track files
if [ -n "$MY_TRACKER" ]; then
	# Auto-append edited file to ## Files if not already listed
	PROJECT_DIR="$(cd "$(dirname "$0")/../.." 2>/dev/null && pwd)"
	REL_FILE="${FILE#$PROJECT_DIR/}"
	if ! grep -qF "$REL_FILE" "$MY_TRACKER" 2>/dev/null; then
		echo "- $REL_FILE" >> "$MY_TRACKER"
	fi

	if [ "$MY_TRACKER_AGE" -le 15 ]; then
		echo '{}'
		exit 0
	fi
	jq -n --arg reason "Tracker $(basename "$MY_TRACKER") not updated in ${MY_TRACKER_AGE}s. UPDATE your tracker before continuing." '{"decision":"block","reason":$reason}'
	exit 0
fi

# Case 2: Pending tracker exists — auto-claim it + track first file
if [ "$PENDING_TRACKER" = "AMBIGUOUS" ]; then
	jq -n --arg reason "Multiple pending progress files found. Claim one manually: set line 2 to <!-- session: $SESSION_ID -->" '{"decision":"block","reason":$reason}'
	exit 0
fi
if [ -n "$PENDING_TRACKER" ]; then
	# Replace "pending" with real session ID using sed
	sed -i '' "s/<!-- session: pending -->/<!-- session: $SESSION_ID -->/" "$PENDING_TRACKER" 2>/dev/null || \
	sed -i "s/<!-- session: pending -->/<!-- session: $SESSION_ID -->/" "$PENDING_TRACKER" 2>/dev/null
	# Track the first edited file
	PROJECT_DIR="$(cd "$(dirname "$0")/../.." 2>/dev/null && pwd)"
	REL_FILE="${FILE#$PROJECT_DIR/}"
	if ! grep -qF "$REL_FILE" "$PENDING_TRACKER" 2>/dev/null; then
		echo "- $REL_FILE" >> "$PENDING_TRACKER"
	fi
	# Touch it so freshness check passes
	touch "$PENDING_TRACKER"
	echo '{}'
	exit 0
fi

# Case 3: No tracker — block
REASON="No progress file for this session. Run /workerc:new to set up."
if [ -n "$UNCLAIMED" ]; then
	REASON="$REASON
Unclaimed trackers you could claim:$UNCLAIMED

To claim: set line 2 to <!-- session: $SESSION_ID -->"
fi
jq -n --arg reason "$REASON" '{"decision":"block","reason":$reason}'
exit 0
