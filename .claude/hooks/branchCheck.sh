#!/bin/bash

if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then 
    exit 0
fi 

CURR_BRANCH=$(git branch --show-current)
# Check for restricted or sensitive branches (e.g., main or production)
if [ "$CURR_BRANCH" = "main" ] || [ "$CURR_BRANCH" = "master" ] || [ "$CURR_BRANCH" = "production" ]; then
    echo "{\"systemMessage\": \"WARNING: You are currently on the sensitive branch '$CURR_BRANCH', create a new feature branch!!!\"}"
    exit
fi

# Gather working tree status
STATUS=$(git status --porcelain)
if [ -n "$STATUS" ]; then
    UNCOMMITTED="true"
    # Indent each changed file under a header, newline-separated
    FILES=$(echo "$STATUS" | sed 's/^/  /')
    MSG=$(printf "\nCurrent branch: %s\nUncommitted changes: %s\nModified files:\n%s" "$CURR_BRANCH" "$UNCOMMITTED" "$FILES")
else
    UNCOMMITTED="false"
    MSG=$(printf "Current branch: %s\nUncommitted changes: %s" "$CURR_BRANCH" "$UNCOMMITTED")
fi

# Escape for JSON: backslashes, quotes, then newlines -> \n
ESCAPED=$(printf '%s' "$MSG" | sed 's/\\/\\\\/g; s/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')
echo "{\"systemMessage\": \"$ESCAPED\"}"
