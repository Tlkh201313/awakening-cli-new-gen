const stage = process.env.SST_STAGE || "dev"

export default {
  url: stage === "production" ? "https://awakened.ai" : `https://${stage}.awakened.ai`,
  console: stage === "production" ? "https://awakened.ai/auth" : `https://${stage}.awakened.ai/auth`,
  email: "contact@anoma.ly",
  socialCard: "https://social-cards.sst.dev",
  github: "https://github.com/anomalyco/awakened",
  discord: "https://awakened.ai/discord",
  headerLinks: [
    { name: "app.header.home", url: "/" },
    { name: "app.header.docs", url: "/docs/" },
  ],
}
