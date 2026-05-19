/**
 * Shared external dependency lists for CLI and SDK bundles.
 *
 * Used by build.ts and validate-externals.ts.
 * When adding a new dependency to package.json, check if it should be
 * added here (large packages, native modules, or packages with many exports).
 */

// Packages that should be kept external in ALL bundles (CLI + SDK)
export const COMMON_EXTERNALS: string[] = [
  // Native image processing
  'sharp',
  // Cloud provider SDKs
  '@aws-sdk/client-bedrock',
  '@aws-sdk/client-bedrock-runtime',
  '@aws-sdk/client-sts',
  '@aws-sdk/credential-providers',
  '@azure/identity',
  'google-auth-library',
  // @vscode/ripgrep ships a platform-specific binary alongside its
  // index.js and resolves the path via __dirname at runtime. Bundling
  // would freeze the build host's absolute path into dist/cli.mjs, so we
  // keep it external and rely on the npm package being installed.
  '@vscode/ripgrep',
  // Orama search engine
  '@orama/orama',
  '@orama/plugin-data-persistence',
  // React ecosystem — external in both CLI + SDK. Saves ~500KB bundle parse.
  // react is in package.json dependencies so it's always in node_modules.
  'react',
  'react-reconciler',
  'react-compiler-runtime',
  // gRPC — large (~3MB bundled). Only used for MCP gRPC connections.
  // External = loaded from node_modules on demand, saves ~100-150ms parse.
  '@grpc/grpc-js',
  '@grpc/proto-loader',
  // Web scraping — medium size, only used by WebFetchTool
  '@mendable/firecrawl-js',
  // LSP protocol — medium size, only used by LSP tools
  'vscode-languageserver-protocol',
  // Anthropic SDK — large. External in SDK already; external in CLI too.
  // Saves ~200ms parse on startup. Resolved from node_modules at runtime.
  '@anthropic-ai/sdk',
  // MCP SDK — medium. Same rationale as Anthropic SDK.
  '@modelcontextprotocol/sdk',
]

// Additional packages external only in the SDK bundle (TUI + heavy deps)
// react, react-reconciler, @anthropic-ai/sdk, @modelcontextprotocol/sdk moved to COMMON_EXTERNALS
export const SDK_ONLY_EXTERNALS: string[] = []

// Packages kept external but NOT listed in package.json dependencies.
// These are dynamically imported at runtime — they're optional and resolved
// from transitive deps or installed by users who need that provider/protocol.
export const OPTIONAL_RUNTIME_EXTERNALS: string[] = [
  // Cloud provider SDKs (dynamically imported per-provider)
  '@aws-sdk/client-bedrock',
  '@aws-sdk/client-bedrock-runtime',
  '@aws-sdk/client-sts',
  '@aws-sdk/credential-providers',
  '@azure/identity',
]

// Computed full lists
export const CLI_EXTERNALS: string[] = COMMON_EXTERNALS
export const SDK_EXTERNALS: string[] = [...COMMON_EXTERNALS, ...SDK_ONLY_EXTERNALS]

// Packages intentionally bundled (not external, not flagged by validation)
// These are small utilities that are fine to inline into the output bundle.
export const INTENTIONALLY_BUNDLED: string[] = [
  // Anthropic provider variants (bundled, not the main SDK)
  '@anthropic-ai/bedrock-sdk',
  '@anthropic-ai/foundry-sdk',
  '@anthropic-ai/sandbox-runtime',
  '@anthropic-ai/vertex-sdk',
  // CLI / TUI utilities
  '@alcalzone/ansi-tokenize',
  '@commander-js/extra-typings',
  'bidi-js',
  'chalk',
  'cli-boxes',
  'cli-highlight',
  'commander',
  'emoji-regex',
  'env-paths',
  'figures',
  'get-east-asian-width',
  'indent-string',
  'strip-ansi',
  'supports-hyperlinks',
  'wrap-ansi',
  // Data formats
  'jsonc-parser',
  'yaml',
  'marked',
  'turndown',
  'xss',
  // Data utilities
  'ajv',
  'auto-bind',
  'diff',
  'fflate',
  'fuse.js',
  'ignore',
  'lodash-es',
  'lru-cache',
  'p-map',
  'picomatch',
  'proper-lockfile',
  'qrcode',
  'semver',
  'shell-quote',
  'signal-exit',
  'stack-utils',
  'code-excerpt',
  'type-fest',
  // Networking
  'axios',
  'cross-spawn',
  'duck-duck-scrape',
  'execa',
  'https-proxy-agent',
  'tree-kill',
  'undici',
  'ws',
  // React hooks utilities (react/react-reconciler/react-compiler-runtime now in COMMON_EXTERNALS)
  'usehooks-ts',
  // Anthropic SDK + MCP SDK now in COMMON_EXTERNALS (external in both CLI + SDK)
  // Schema validation
  'zod',
  // File watching
  'chokidar',
]
