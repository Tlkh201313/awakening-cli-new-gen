/**
 * Application-wide constants and configuration
 */
export const config = {
  // Base URL
  baseUrl: "https://awakened.ai",

  // GitHub
  github: {
    repoUrl: "https://github.com/anomalyco/awakened",
    starsFormatted: {
      compact: "160K",
      full: "160,000",
    },
  },

  // Social links
  social: {
    twitter: "https://x.com/awakened",
    discord: "https://discord.gg/awakened",
  },

  // Static stats (used on landing page)
  stats: {
    contributors: "900",
    commits: "13,000",
    monthlyUsers: "7.5M",
  },
} as const
