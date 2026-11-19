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

const homeUrl = absolute('/')

/** The author, described in full on the home page and pointed to from articles. */
const person = {
  '@type': 'Person',
  '@id': `${homeUrl}#person`,
  name: site.author.name,
  alternateName: site.author.alternateName,
  jobTitle: site.author.jobTitle,
  url: homeUrl,
  image: absolute(site.author.image),
  sameAs: site.externalLinks.map((link) => link.url),
}
const personRef = { '@type': 'Person', '@id': person['@id'], name: person.name, url: homeUrl }

/** The <head> tags of a page: title, description, link preview, structured data. */
export function pageHead(page: PageMeta) {
  const url = absolute(page.path)
  const image = page.image ?? site.defaultImage
  const imageUrl = absolute(image.path)
  const isHome = page.path === '/'
  const description = page.description ?? site.description
  const title = isHome ? site.homeTitle : page.title
  const imageObject = { '@type': 'ImageObject', url: imageUrl, width: image.width, height: image.height, caption: image.alt }

  // The home page: the site and the person behind it. An article: a blog post by that person.
  const structuredData = isHome
    ? {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            '@id': `${homeUrl}#website`,
            url,
            name: site.title,
            headline: title,
            description,
            image: imageObject,
            author: { '@id': person['@id'] },
            publisher: { '@id': person['@id'] },
          },
          person,
        ],
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: page.title,
        description,
        image: imageObject,
        url,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        author: personRef,
        publisher: personRef,
        ...(page.date ? { datePublished: page.date, dateModified: page.date } : {}),
      }

  const meta: Array<Record<string, string>> = [
    { title: isHome ? title : `${title} | ${site.title}` },
    { name: 'description', content: description },
    { name: 'author', content: site.author.name },
    { property: 'og:title', content: title },
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
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: imageUrl },
    { name: 'twitter:image:alt', content: image.alt },
    { name: 'twitter:site', content: `@${site.twitter}` },
    { name: 'twitter:creator', content: `@${site.twitter}` },
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
