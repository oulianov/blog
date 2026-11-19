// Vite plugin: `virtual:pages` lists the pages (their front matter), and
// importing a `.markdown` file gives its rendered HTML.

import path from 'node:path'
import type { Plugin } from 'vite'
import { loadPages, pageFiles, renderPage, root } from './content.ts'

const PAGES_ID = 'virtual:pages'
const RESOLVED_PAGES_ID = '\0virtual:pages'

export function markdownPages(): Plugin {
  return {
    name: 'markdown-pages',
    resolveId(id) {
      if (id === PAGES_ID) return RESOLVED_PAGES_ID
    },
    load(id) {
      if (id !== RESOLVED_PAGES_ID) return
      for (const file of pageFiles()) this.addWatchFile(path.join(root, file))
      return `export const pages = ${JSON.stringify(loadPages())}`
    },
    async transform(_code, id) {
      const file = id.split('?')[0]
      if (!file.endsWith('.markdown')) return
      const rendered = await renderPage(path.relative(root, file))
      return { code: `export default ${JSON.stringify(rendered)}`, map: null }
    },
    hotUpdate({ file, modules }) {
      if (!file.endsWith('.markdown')) return
      const list = this.environment.moduleGraph.getModuleById(RESOLVED_PAGES_ID)
      if (!list) return
      this.environment.moduleGraph.invalidateModule(list)
      return [...modules, list]
    },
  }
}
