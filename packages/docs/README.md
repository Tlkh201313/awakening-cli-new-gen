# Awakened Documentation

Documentation site for the Awakened project, built with [Mintlify](https://mintlify.com).

## Development

Install the Mintlify CLI:

```bash
npm i -g mint
```

Run the local preview from this directory (where `docs.json` is located):

```bash
mint dev
```

View at `http://localhost:3000`.

## Publishing Changes

Install the Mintlify GitHub app from your [dashboard](https://dashboard.mintlify.com/settings/organization/github-app) to propagate changes from your repo to your deployment. Changes are deployed to production automatically after pushing to the default branch.

## Troubleshooting

- If your dev environment isn't running: Run `mint update` to ensure you have the most recent version of the CLI.
- If a page loads as a 404: Make sure you are running in a folder with a valid `docs.json`.
