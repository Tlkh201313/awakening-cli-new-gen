import { AWAKENED_CAPABILITY_IDS } from "../ids"
import type { AutoCapabilityDefinition } from "../types"

const MARKETING_RE =
  /\b(marketing|seo\b|gsc\b|outbound|cold email|linkedin|conversion|cro\b|landing page|icp\b|pipeline|hubspot|sales playbook|gtm|go[- ]?to[- ]?market|a\/b test|growth experiment|content ops|podcast clips?|gong\b|attribution|pricing tier|pitch deck|youtube competitive|newsletter|lead magnet|prospecting|instantly|rb2b|copywriting|funnel)\b/i

export const awakenedMarketingCapability: AutoCapabilityDefinition = {
  id: AWAKENED_CAPABILITY_IDS.marketing,
  displayName: "Awakened Marketing",
  description: "AI marketing & sales skills (Single Brain / ericosiu)",
  priority: 65,
  shouldActivate({ userText }) {
    return MARKETING_RE.test(userText)
  },
  getContent() {
    return `# Awakened Marketing

Upstream: https://github.com/ericosiu/ai-marketing-skills

## Setup

\`\`\`bash
git clone https://github.com/ericosiu/ai-marketing-skills.git
cd ai-marketing-skills/<category> && pip install -r requirements.txt
\`\`\`

## Categories (pick one)

growth-engine · sales-pipeline · content-ops · outbound-engine · seo-ops · finance-ops · revenue-intelligence · conversion-ops · podcast-ops · team-ops · sales-playbook · autoresearch · deck-generator · yt-competitive-analysis · x-longform-post

Read that folder's SKILL.md; run Python scripts with \`.env\` API keys. Respect security/sanitizer before commits.
`
  },
}
