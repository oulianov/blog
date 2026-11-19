// Reads the Markdown pages (the same files the Jekyll site used) and turns
// them into HTML at build time. Used by the Vite plugin and the post-build
// script.

import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { parse as parseYaml } from 'yaml'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkSmartypants from 'remark-smartypants'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeKatex from 'rehype-katex'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeShiki from '@shikijs/rehype'
import rehypeStringify from 'rehype-stringify'
import { visit } from 'unist-util-visit'
import type { Element, Root } from 'hast'
import { colorCycle, shapeBySlug, type ColorName, type ShapeName } from '../site.config.ts'

export const root = path.resolve(import.meta.dirname, '..')

export interface PageImage {
  path: string
  width: number
  height: number
  alt: string
}

export interface PageMeta {
  /** URL path, with a trailing slash: "/" or "/docs/nlp/". */
  path: string
  /** Source file, relative to the repository root. */
  file: string
  slug: string
  title: string
  navOrder: number
  description?: string
  /** A short intro, 10 words at most, for the cards of the home page. */
  summary?: string
  image?: PageImage
  /** ISO 8601 date, if the page has one. */
  date?: string
  color: ColorName
  shape: ShapeName
}

export interface RenderedPage {
  /** Inner HTML of the page's first h1, shown in the colored header. */
  heading: string
  /** Inner HTML of the paragraph right after the h1 (home page only). */
  lead?: string
  /** The rest of the page. */
  html: string
}

/** The source files, relative to the repository root. */
export function pageFiles(): string[] {
  const docs = readdirSync(path.join(root, 'docs'))
    .filter((name) => name.endsWith('.markdown'))
    .map((name) => `docs/${name}`)
  return ['index.markdown', ...docs]
}

function splitFrontMatter(source: string): { data: Record<string, any>; body: string } {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) return { data: {}, body: source }
  return { data: parseYaml(match[1]) ?? {}, body: source.slice(match[0].length) }
}

/** "2026-11-17 00:00:00 +0100" → "2026-11-17T00:00:00+01:00" */
function toIsoDate(value: unknown): string | undefined {
  if (!value) return undefined
  const text = String(value).trim()
  const match = text.match(/^(\d{4}-\d\d-\d\d)(?:[ T](\d\d:\d\d(?::\d\d)?))?\s*(?:([+-]\d\d):?(\d\d)|Z)?$/)
  if (!match) throw new Error(`Unreadable date: ${text}`)
  const [, day, time = '00:00:00', tzHours, tzMinutes] = match
  const zone = tzHours ? `${tzHours}:${tzMinutes}` : 'Z'
  return `${day}T${time.length === 5 ? `${time}:00` : time}${zone}`
}

function urlPath(file: string): string {
  if (file === 'index.markdown') return '/'
  return `/${file.replace(/\.markdown$/, '')}/`
}

export function loadPages(): PageMeta[] {
  const pages = pageFiles().map((file) => {
    const { data } = splitFrontMatter(readFileSync(path.join(root, file), 'utf8'))
    const url = urlPath(file)
    return {
      path: url,
      file,
      slug: url.split('/').filter(Boolean).pop() ?? '',
      title: String(data.title ?? ''),
      navOrder: Number(data.nav_order ?? 99),
      description: data.description,
      summary: data.summary,
      image: data.image,
      date: toIsoDate(data.date),
      color: data.color,
      shape: data.shape,
    }
  })
  pages.sort((a, b) => a.navOrder - b.navOrder || a.title.localeCompare(b.title))
  // Pages take the four colors in turn, and the model of their topic,
  // unless their front matter picks one.
  return pages.map((page, index) => ({
    ...page,
    color: page.color ?? colorCycle[(index + colorCycle.length - 1) % colorCycle.length],
    shape: page.shape ?? shapeBySlug[page.slug] ?? 'pin',
  }))
}

const escapeAttribute = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/** Jekyll includes and Liquid tags, rewritten as plain HTML. */
function replaceLiquid(body: string, file: string): string {
  const withoutBaseurl = body.replace(/\{\{\s*site\.baseurl\s*\}\}/g, '')
  return withoutBaseurl.replace(/\{%\s*include\s+(\S+)\s*(.*?)\s*%\}/g, (_tag, name: string, args: string) => {
    const params = Object.fromEntries(
      [...args.matchAll(/(\w+)="([^"]*)"/g)].map(([, key, value]) => [key, value]),
    )
    if (name === 'youtubePlayer.html') {
      return (
        `<div class="embed"><iframe src="https://www.youtube.com/embed/${escapeAttribute(params.id)}" ` +
        `title="YouTube video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ` +
        `allowfullscreen></iframe></div>`
      )
    }
    if (name === 'video.html') {
      const src = `/${params.src.replace(/^\/+/, '')}`
      return `<video controls preload="metadata" width="640" height="360"><source src="${escapeAttribute(src)}" type="video/mp4"></video>`
    }
    throw new Error(`${file}: unknown include ${name}`)
  })
}

/**
 * Kramdown attribute lists on links and images, such as
 * `[Download](url){: .btn .btn-primary }` or `![Alt](src){: width="200" }`,
 * rewritten as HTML tags.
 */
function replaceAttributeLists(body: string): string {
  return body.replace(
    /(!?)\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\{:\s*([^}]*)\}/g,
    (_all, bang: string, text: string, url: string, title: string | undefined, list: string) => {
      const classes: string[] = []
      const attributes: string[] = []
      for (const [, cls, key, value] of list.matchAll(/\.([\w-]+)|([\w-]+)=["']([^"']*)["']/g)) {
        if (cls) classes.push(cls)
        else attributes.push(`${key}="${escapeAttribute(value)}"`)
      }
      if (classes.length) attributes.unshift(`class="${classes.join(' ')}"`)
      if (title) attributes.push(`title="${escapeAttribute(title)}"`)
      const extra = attributes.length ? ` ${attributes.join(' ')}` : ''
      if (bang) return `<img src="${escapeAttribute(url)}" alt="${escapeAttribute(text)}"${extra}>`
      return `<a href="${escapeAttribute(url)}"${extra}>${text}</a>`
    },
  )
}

interface Extracted {
  heading?: Element
  lead?: Element
}

/** Takes the first h1 out of the page, for the colored header, and the paragraph after it if asked. */
function extractHeading(store: Extracted, withLead: boolean) {
  return (tree: Root) => {
    const index = tree.children.findIndex((node) => node.type === 'element' && node.tagName === 'h1')
    if (index === -1) return
    store.heading = tree.children[index] as Element
    tree.children.splice(index, 1)
    if (!withLead) return
    const next = tree.children.findIndex((node, i) => i >= index && node.type === 'element')
    const paragraph = tree.children[next]
    if (paragraph?.type === 'element' && paragraph.tagName === 'p') {
      store.lead = paragraph
      tree.children.splice(next, 1)
    }
  }
}

/**
 * List items that start with years, as in "2023-2025 - Joined…", get the
 * years in their own element: <span class="when">2023–2025</span>, and the
 * rest in <span class="what">.
 */
function markYears(options?: { enabled: boolean }) {
  return (tree: Root) => {
    if (!options?.enabled) return
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'li') return
      const first = node.children[0]
      if (first?.type !== 'text') return
      const match = first.value.match(/^\s*(\d{4})\s*(?:-\s*(\d{4}))?\s*-\s*/)
      if (!match) return
      first.value = first.value.slice(match[0].length)
      const when = match[2] ? `${match[1]}–${match[2]}` : `${match[1]}–`
      node.children = [
        { type: 'element', tagName: 'span', properties: { className: ['when'] }, children: [{ type: 'text', value: when }] },
        { type: 'element', tagName: 'span', properties: { className: ['what'] }, children: node.children },
      ]
      node.properties.className = ['dated']
    })
  }
}

/**
 * Folds the timeline after its first entry: the other entries go into
 * <details class="more"> with a "More" button, and what follows the list
 * stays in view. They stay in the HTML, so search engines still read them.
 */
function foldTimeline(options?: { enabled: boolean }) {
  return (tree: Root) => {
    if (!options?.enabled) return
    const listIndex = tree.children.findIndex(
      (node) =>
        node.type === 'element' &&
        node.tagName === 'ul' &&
        node.children.some((child) => child.type === 'element' && (child.properties.className as string[] | undefined)?.includes('dated')),
    )
    if (listIndex === -1) return
    const list = tree.children[listIndex] as Element
    const items = list.children.filter((child): child is Element => child.type === 'element' && child.tagName === 'li')
    if (items.length < 2) return
    list.children = [items[0]]
    const label = (text: string, className: string): Element => ({
      type: 'element',
      tagName: 'span',
      properties: { className: [className] },
      children: [{ type: 'text', value: text }],
    })
    tree.children.splice(listIndex + 1, 0, {
      type: 'element',
      tagName: 'details',
      properties: { className: ['more'] },
      children: [
        { type: 'element', tagName: 'summary', properties: {}, children: [label('More', 'show-more'), label('Less', 'show-less')] },
        { type: 'element', tagName: 'ul', properties: {}, children: items.slice(1) },
      ],
    })
  }
}

/** Lazy images (but the first one, often in view), and tables that scroll on small screens. */
function polishElements() {
  return (tree: Root) => {
    let images = 0
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName === 'img') {
        if (images++ > 0) node.properties.loading ??= 'lazy'
        node.properties.decoding ??= 'async'
      }
      if (node.tagName === 'table' && parent && index !== undefined) {
        parent.children[index] = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['table-wrapper'] },
          children: [node],
        }
      }
    })
  }
}

export async function renderPage(file: string): Promise<RenderedPage> {
  const source = readFileSync(path.join(root, file), 'utf8')
  const { body } = splitFrontMatter(source)
  const markdown = replaceAttributeLists(replaceLiquid(body, file))
  const store: Extracted = {}
  const isHome = file === 'index.markdown'

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    // Kramdown writes math as $$…$$; a single $ is just a price.
    .use(remarkMath, { singleDollarTextMath: false })
    .use(remarkSmartypants, { dashes: 'oldschool' })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeKatex, { strict: false, throwOnError: false })
    .use(rehypeSlug)
    .use(() => extractHeading(store, isHome))
    .use(markYears, { enabled: isHome })
    .use(foldTimeline, { enabled: isHome })
    .use(rehypeAutolinkHeadings, {
      behavior: 'append',
      properties: { className: ['anchor'], ariaHidden: 'true', tabIndex: -1 },
      content: { type: 'text', value: '#' },
    })
    .use(polishElements)
    .use(rehypeShiki, {
      theme: 'vitesse-black',
      defaultLanguage: 'text',
      fallbackLanguage: 'text',
    })
    .use(rehypeStringify)

  const html = String(await processor.process(markdown))
  const inner = (element?: Element) =>
    element ? unified().use(rehypeStringify).stringify({ type: 'root', children: element.children }) : ''
  const rendered: RenderedPage = { heading: inner(store.heading), html }
  if (store.lead) rendered.lead = inner(store.lead)
  return rendered
}
