import { createFileRoute } from '@tanstack/react-router'
import { HomeHero, ProjectWall } from '../components/Hero.tsx'
import { findPage, loadContent, pageHead } from '../lib/pages.ts'

const home = findPage('/')!

export const Route = createFileRoute('/')({
  loader: () => loadContent(home),
  head: () => pageHead(home),
  component: Home,
})

function Home() {
  const content = Route.useLoaderData()
  return (
    <article className="page home">
      <HomeHero heading={content.heading} lead={content.lead} bio={content.html} />
      <ProjectWall />
    </article>
  )
}
