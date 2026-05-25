import { AWAKENED_CAPABILITY_IDS } from "../ids"
import { primaryBootstrap } from "../primaryBootstrap"
import type { AutoCapabilityDefinition } from "../types"

const AWS_RE =
  /\b(aws\b|lambda\b|dynamodb|s3 bucket|cloudformation|terraform aws|ecs\b|eks\b|iam role|api gateway|cdk\b|sam cli|bedrock\b|sagemaker)\b/i

export const awakenedAwsCapability: AutoCapabilityDefinition = {
  id: AWAKENED_CAPABILITY_IDS.aws,
  displayName: "Awakened AWS",
  description: "AWS Toolkit and cloud infrastructure skills",
  priority: 68,
  shouldActivate(ctx) {
    return AWS_RE.test(ctx.userText) || primaryBootstrap(ctx)
  },
  getContent() {
    return `# Awakened AWS

Upstream: **AWS Toolkit** skills (43 playbooks) + VoltAgent AWS entries on officialskills.sh.

## Install

Browse **officialskills.sh** for \`aws\`, \`lambda\`, \`cdk\` skills — install **one** skill per task.

Or antigravity bundle: \`Use @aws-architect …\` after \`npx antigravity-awesome-skills\`.

## Workflow

1. Confirm account/region and least-privilege IAM before proposing resources.
2. Prefer IaC (CDK/Terraform) over console click-ops in agent responses.
3. Read existing infra in repo before creating duplicate stacks.
4. Skill \`aws-cloud\` (built-in) for awakened-specific guardrails.

## Safety

- Never paste access keys into chat or commits.
- Use env/profile; validate \`aws sts get-caller-identity\` when unsure.
- Flag public S3 buckets, open security groups, and overly broad IAM.
`
  },
}
