import { useState, type CSSProperties, type ReactNode } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { palette, site } from '../../site.config.ts'
import { pages } from '../lib/pages.ts'

function Mark() {
  return (
    <svg className="mark" viewBox="0 0 2 2" aria-hidden="true">
      <rect width="1" height="1" fill={palette.orange} />
      <rect x="1" width="1" height="1" fill={palette.blue} />
      <rect y="1" width="1" height="1" fill={palette.pink} />
      <rect x="1" y="1" width="1" height="1" fill={palette.green} />
    </svg>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const [open, setOpen] = useState(false)
  const current = pathname.endsWith('/') ? pathname : `${pathname}/`

  return (
    <div className="site">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <div className="sidebar-top">
          <Link to="/" className="site-title" onClick={() => setOpen(false)}>
            <Mark />
            {site.title}
          </Link>
          <button
            type="button"
            className="menu-button"
            aria-expanded={open}
            aria-controls="site-nav"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
        <nav id="site-nav" aria-label="Main" className={open ? 'open' : undefined}>
          <ul className="nav-list">
            {pages.map((page) => (
              <li key={page.path}>
                <Link
                  to={page.path === '/' ? '/' : '/docs/$slug/'}
                  params={page.path === '/' ? undefined : { slug: page.slug }}
                  className="nav-link"
                  aria-current={page.path === current ? 'page' : undefined}
                  style={{ '--swatch': palette[page.color] } as CSSProperties}
                  onClick={() => setOpen(false)}
                >
                  <span className="swatch" aria-hidden="true" />
                  {page.title}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="nav-list external">
            {site.externalLinks.map((link) => (
              <li key={link.url}>
                <a href={link.url} className="nav-link">
                  {link.title}
                  <span aria-hidden="true"> ↗</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main id="main" className="main">
        {children}
        <footer className="footer">
          <div className="stripe" aria-hidden="true">
            <span style={{ background: palette.pink }} />
            <span style={{ background: palette.green }} />
            <span style={{ background: palette.orange }} />
            <span style={{ background: palette.blue }} />
          </div>
          <p>
            {site.title} · <a href="/feed.xml">Feed</a>
          </p>
        </footer>
      </main>
    </div>
  )
}
