#!/bin/bash

# Function to process a file
process_file() {
  local file=$1
  # Create a temporary file
  temp_file=$(mktemp)
  
  # Process the file, removing AppLayout import and wrapper
  awk '
    # Skip the AppLayout import line
    /^import AppLayout from/ {next}
    # Remove AppLayout wrapper
    /<AppLayout>/ {next}
    /<\/AppLayout>/ {next}
    # Print all other lines
    {print}
  ' "$file" > "$temp_file"
  
  # Move the temp file back to original
  mv "$temp_file" "$file"
}

# Find and process all page files
find src/app/\(authenticated\) -name "page.tsx" -type f | while read -r file; do
  echo "Processing $file"
  process_file "$file"
done 