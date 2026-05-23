import { join } from 'path'
import type { WikiPaths } from './types.js'

import { CONFIG_DIR_NAME } from '../../constants/brand.js'

export const WIKI_DIRNAME = 'wiki'

export function getWikiPaths(cwd: string): WikiPaths {
  const root = join(cwd, CONFIG_DIR_NAME, WIKI_DIRNAME)

  return {
    root,
    pagesDir: join(root, 'pages'),
    sourcesDir: join(root, 'sources'),
    schemaFile: join(root, 'schema.md'),
    indexFile: join(root, 'index.md'),
    logFile: join(root, 'log.md'),
  }
}
