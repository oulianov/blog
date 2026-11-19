// After `vite build`: writes the sitemap and the Atom feed next to the
// prerendered pages, and checks that every page was prerendered.

import { existsSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { loadPages, root } from '../plugins/content.ts'
import { site } from '../site.config.ts'

const out = path.join(root, 'dist', 'client')
const pages = loadPages()

const missing = pages.filter((page) => !existsSync(path.join(out, page.path, 'index.html')))
if (missing.length) {
  throw new Error(`Not prerendered: ${missing.map((page) => page.path).join(', ')}`)
}
if (!existsSync(path.join(out, '404.html'))) throw new Error('Not prerendered: 404.html')

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const absolute = (urlPath: string) => new URL(urlPath, site.url).href

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map((page) => `<url><loc>${absolute(page.path)}</loc>${page.date ? `<lastmod>${page.date}</lastmod>` : ''}</url>`)
  .join('\n')}
</urlset>
`
writeFileSync(path.join(out, 'sitemap.xml'), sitemap)

const posts = pages
  .filter((page) => page.date && page.path !== '/')
  .sort((a, b) => (b.date! < a.date! ? -1 : 1))
const feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
<title>${escape(site.title)}</title>
<subtitle>${escape(site.description)}</subtitle>
<link href="${absolute('/feed.xml')}" rel="self" type="application/atom+xml"/>
<link href="${absolute('/')}" rel="alternate" type="text/html"/>
<id>${absolute('/')}</id>
<updated>${posts[0]?.date ?? new Date().toISOString()}</updated>
<author><name>${escape(site.title)}</name></author>
${posts
  .map(
    (page) => `<entry>
<title>${escape(page.title)}</title>
<link href="${absolute(page.path)}" rel="alternate" type="text/html"/>
<id>${absolute(page.path)}</id>
<published>${page.date}</published>
<updated>${page.date}</updated>
<summary>${escape(page.description ?? '')}</summary>
</entry>`,
  )
  .join('\n')}
</feed>
`
writeFileSync(path.join(out, 'feed.xml'), feed)

console.log(`postbuild: ${pages.length} pages, sitemap.xml and feed.xml written to dist/client`)
