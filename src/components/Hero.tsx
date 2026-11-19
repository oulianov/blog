import { useState, type CSSProperties } from 'react'
import { Link } from '@tanstack/react-router'
import { palette, type ColorName, type ShapeName } from '../../site.config.ts'
import { pages, type PageMeta } from '../lib/pages.ts'
import { Article } from './Article.tsx'
import { Silhouette } from './Silhouette.tsx'

const describe = (shape: ShapeName, color: ColorName) =>
  `A black ${shape} turning on ${color}. Click it or drag it.`

/** A page's header: its title on a flat color, next to a big turning model. */
export function PageHero({ page, heading }: { page: PageMeta; heading: string }) {
  return (
    <header className="hero" data-silhouette-area style={{ '--page-color': palette[page.color] } as CSSProperties}>
      <div className="hero-text">
        <h1 className="hero-title" dangerouslySetInnerHTML={{ __html: heading }} />
      </div>
      <div className="hero-art">
        <Silhouette shapes={[page.shape]} label={describe(page.shape, page.color)} />
      </div>
    </header>
  )
}

const articles = pages.filter((page) => page.path !== '/')
const home = pages.find((page) => page.path === '/')

// The home model first, then one per article: a click swaps to the next.
const heroCycle: Array<{ shape: ShapeName; color: ColorName; page?: PageMeta }> = [
  { shape: home?.shape ?? 'laptop', color: 'orange' },
  ...articles.map((page) => ({ shape: page.shape, color: page.color, page })),
]

/**
 * The home page header, which is also the "about me": the name, very big,
 * the bio, and the laptop with my face on its screen. A click on the laptop
 * swaps it for the model of each article in turn.
 */
export function HomeHero({ heading, lead, bio }: { heading: string; lead?: string; bio: string }) {
  const [index, setIndex] = useState(0)
  const current = heroCycle[index]

  return (
    <header
      id="about"
      className="home-hero"
      data-silhouette-area
      style={{ '--page-color': palette[current.color] } as CSSProperties}
    >
      <div className="home-intro">
        <h1 className="home-title" dangerouslySetInnerHTML={{ __html: heading }} />
        {lead && <p className="home-lead" dangerouslySetInnerHTML={{ __html: lead }} />}
      </div>
      <div className="home-hero-art">
        <div className="home-hero-stage">
          <Silhouette
            shapes={heroCycle.map((item) => item.shape)}
            screenImage="/assets/face-screen.jpg"
            label="Nicolas Oulianov's face on the screen of a black laptop. Click it to see the next model."
            onSwap={setIndex}
          />
          {current.page && (
            <p className="hero-caption">
              <Link to="/docs/$slug/" params={{ slug: current.page.slug }}>
                {current.page.title} <span aria-hidden="true">→</span>
              </Link>
            </p>
          )}
        </div>
      </div>
      <div className="home-bio">
        <Article html={bio} />
      </div>
    </header>
  )
}

/** Every article as a tile: its color, its model, its title. */
export function ProjectWall() {
  return (
    <section id="projects" className="wall-section" aria-labelledby="projects-title">
      <h2 id="projects-title" className="section-title">
        Projects and stories
      </h2>
      <ul className="wall">
        {articles.map((page) => (
          <li key={page.path}>
            <Link
              to="/docs/$slug/"
              params={{ slug: page.slug }}
              className="tile"
              data-silhouette-area
              style={{ '--page-color': palette[page.color] } as CSSProperties}
            >
              <span className="tile-text">
                <span className="tile-title">{page.title}</span>
                {(page.summary ?? page.description) && (
                  <span className="tile-description">{page.summary ?? page.description}</span>
                )}
                <span className="tile-more" aria-hidden="true">
                  Read →
                </span>
              </span>
              <span className="tile-art">
                <Silhouette shapes={[page.shape]} interactive={false} hopOnHover />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
