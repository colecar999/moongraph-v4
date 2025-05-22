#!/bin/bash

# Create the authenticated route group directory
mkdir -p src/app/\(authenticated\)

# List of pages to move
pages=(
  "dashboard"
  "home"
  "chat"
  "agent"
  "cosmograph"
  "system"
  "graphs"
  "documents"
)

# Move each page
for page in "${pages[@]}"; do
  if [ -d "src/app/$page" ]; then
    mv "src/app/$page" "src/app/(authenticated)/"
  fi
done 