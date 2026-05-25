function withSlash(input: string) {
  return input.endsWith("/") ? input : `${input}/`
}

export const MARKETPLACE_FETCH_TIMEOUT_MS = 15_000
export const MARKETPLACE_GIT_CLONE_TIMEOUT_MS = 30_000
export const MARKETPLACE_GIT_PULL_TIMEOUT_MS = 15_000
export const MARKETPLACE_LOAD_TIMEOUT_MS = 60_000

export function githubGitUrl(repo: string) {
  const base = process.env.AWAKENED_REPO_CLONE_GITHUB_BASE_URL
  if (!base) return `https://github.com/${repo}.git`
  return new URL(`${repo}.git`, withSlash(base)).href
}

export function githubRawUrl(repo: string, ref: string, filePath: string) {
  return `https://raw.githubusercontent.com/${repo}/${ref}/${filePath}`
}

export function githubRefCandidates(ref?: string) {
  if (ref) return [ref]
  return ["main", "master"]
}

export function rewriteGithubCloneUrl(url: string) {
  const match = url.match(/^https:\/\/github\.com\/([^/]+\/[^/]+?)(?:\.git)?(?:#.*)?\/?$/i)
  if (!match) return url
  return githubGitUrl(match[1]!)
}

export function marketplaceNetworkHint(detail: string) {
  const mirror = process.env.AWAKENED_REPO_CLONE_GITHUB_BASE_URL
  const lines = [
    detail,
    "Could not reach GitHub. Check your network, VPN, or proxy settings.",
  ]
  if (!mirror) {
    lines.push(
      "Set AWAKENED_REPO_CLONE_GITHUB_BASE_URL to a GitHub mirror base URL (same as repo clone) and retry.",
    )
  }
  return lines.join("\n")
}

export async function fetchGithubRaw(repo: string, ref: string, filePath: string) {
  try {
    const response = await fetch(githubRawUrl(repo, ref, filePath), {
      signal: AbortSignal.timeout(MARKETPLACE_FETCH_TIMEOUT_MS),
    })
    if (!response.ok) return
    return response.text()
  } catch {
    return
  }
}
