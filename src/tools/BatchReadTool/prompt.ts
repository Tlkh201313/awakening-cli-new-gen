export function getPrompt(): string {
  return `Read multiple files in parallel for faster multi-file inspection.

## When to Use

- Reading 2-20 related files (e.g., test files, config files, module set)
- Comparing multiple files side-by-side
- Gathering context from multiple sources simultaneously

## When NOT to Use

- Single file reads (use Read tool instead)
- More than 20 files (break into multiple BatchRead calls)
- Files requiring different offset/limit per file (use individual Read calls)

## Features

- Parallel execution for speed
- Partial success: returns successful reads even if some files fail
- Same offset/limit applied to all files
- Supports all file types (text, images, PDFs, notebooks)

## Example

\`\`\`
{
  "file_paths": [
    "src/auth/login.ts",
    "src/auth/logout.ts",
    "src/auth/middleware.ts"
  ],
  "offset": 1,
  "limit": 100
}
\`\`\`
`
}
