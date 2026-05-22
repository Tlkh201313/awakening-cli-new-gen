export function getPrompt(): string {
  return `Get a quick snapshot of the git repository state in one call.

## What It Returns

Combines three git commands into a single read-only snapshot:
1. **git status --short** - Changed/staged/untracked files
2. **git diff --stat** - Statistics of unstaged changes
3. **git log -1 --oneline** - Most recent commit

## When to Use

- Quick repository state check before making changes
- Understanding current working tree status
- Checking what's staged vs unstaged
- Seeing the last commit context

## When NOT to Use

- For detailed diffs (use Bash with \`git diff\`)
- For full commit history (use Bash with \`git log\`)
- For git write operations (use Bash)
- Outside a git repository (will error)

## Benefits

- Read-only and safe (no modifications)
- Single tool call instead of 3 Bash calls
- Classifier-friendly output format
- Works even with restricted Bash permissions

## Example Output

\`\`\`
=== Git Repository Snapshot ===

## Status (git status --short)
 M src/file1.ts
?? src/file2.ts

## Diff Stats (git diff --stat)
 src/file1.ts | 10 +++++-----
 1 file changed, 5 insertions(+), 5 deletions(-)

## Last Commit (git log -1 --oneline)
a1b2c3d feat: add new feature
\`\`\`
`
}
