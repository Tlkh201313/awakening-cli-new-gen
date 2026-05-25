# AWS Cloud

Infrastructure and AWS service work with least-privilege defaults.

## Before proposing resources

1. Confirm region, account, and existing IaC in the repo.
2. Run `aws sts get-caller-identity` when identity is unclear.
3. Prefer CDK/Terraform over one-off console steps.

## Safety

- Never commit access keys or `.env` secrets.
- Flag public S3 buckets, `0.0.0.0/0` security groups, and `*` IAM actions.
- Document rollback for destructive changes.

## Skills catalog

Install one official AWS skill from officialskills.sh or antigravity `@aws-*` per task — do not load the full catalog.
