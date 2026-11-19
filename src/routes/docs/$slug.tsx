import type { CSSProperties } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { palette } from '../../../site.config.ts'
import { Article } from '../../components/Article.tsx'
import { PageHero } from '../../components/Hero.tsx'
import { findPage, loadContent, pageHead } from '../../lib/pages.ts'

export const Route = createFileRoute('/docs/$slug')({
  loader: async ({ params }) => {
    const page = findPage(`/docs/${params.slug}/`)
    if (!page) throw notFound()
    return { page, content: await loadContent(page) }
  },
  head: ({ loaderData }) => (loaderData ? pageHead(loaderData.page) : {}),
  component: DocPage,
})

function DocPage() {
  const { page, content } = Route.useLoaderData()
  return (
    <article className="page" style={{ '--page-color': palette[page.color] } as CSSProperties}>
      <PageHero page={page} heading={content.heading} />
      <div className="content">
        <Article html={content.html} />
      </div>
    </article>
  )
}
