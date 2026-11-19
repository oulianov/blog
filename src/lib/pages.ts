import { pages as pageList } from 'virtual:pages'
import type { PageMeta, RenderedPage } from '../../plugins/content.ts'
import { site } from '../../site.config.ts'

export type { PageMeta, RenderedPage }

/** Every page, in nav order. */
export const pages: PageMeta[] = pageList

// One lazy chunk per page.
const modules = import.meta.glob<RenderedPage>(['/index.markdown', '/docs/*.markdown'], {
  import: 'default',
})

export function findPage(urlPath: string): PageMeta | undefined {
  const normalized = urlPath.endsWith('/') ? urlPath : `${urlPath}/`
  return pages.find((page) => page.path === normalized)
}

export function loadContent(page: PageMeta): Promise<RenderedPage> {
  const load = modules[`/${page.file}`]
  if (!load) throw new Error(`No content for ${page.file}`)
  return load()
}

const absolute = (urlPath: string) => new URL(urlPath, site.url).href

/** The <head> tags of a page: title, description, link preview, structured data. */
export function pageHead(page: PageMeta) {
  const url = absolute(page.path)
  const image = page.image ?? site.defaultImage
  const imageUrl = absolute(image.path)
  const isHome = page.path === '/'
  const description = page.description ?? site.description

  const structuredData: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': isHome ? 'WebSite' : 'BlogPosting',
    description,
    headline: page.title,
    image: { width: image.width, height: image.height, alt: image.alt, url: imageUrl, '@type': 'imageObject' },
    url,
  }
  if (isHome) structuredData.name = site.title
  else structuredData.mainEntityOfPage = { '@type': 'WebPage', '@id': url }
  if (page.date) {
    structuredData.datePublished = page.date
    structuredData.dateModified = page.date
  }

  const meta: Array<Record<string, string>> = [
    { title: `${page.title} | ${site.title}` },
    { name: 'description', content: description },
    { property: 'og:title', content: page.title },
    { property: 'og:locale', content: 'en_US' },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
    { property: 'og:site_name', content: site.title },
    { property: 'og:image', content: imageUrl },
    { property: 'og:image:width', content: String(image.width) },
    { property: 'og:image:height', content: String(image.height) },
    { property: 'og:image:alt', content: image.alt },
    { property: 'og:type', content: isHome ? 'website' : 'article' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: page.title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: imageUrl },
    { name: 'twitter:image:alt', content: image.alt },
    { name: 'twitter:site', content: `@${site.twitter}` },
  ]
  if (page.date && !isHome) {
    meta.push({ property: 'article:published_time', content: page.date })
    meta.push({ property: 'article:modified_time', content: page.date })
  }

  return {
    meta: [...meta, { 'script:ld+json': structuredData } as unknown as Record<string, string>],
    links: [{ rel: 'canonical', href: url }],
  }
}
