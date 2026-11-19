/// <reference types="vite/client" />
import type { ReactNode } from 'react'
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { site } from '../../site.config.ts'
import { Layout } from '../components/Layout.tsx'
import { NotFound } from '../components/NotFound.tsx'
import styles from '../styles.css?url'
import bodyFont from '@fontsource-variable/source-sans-3/files/source-sans-3-latin-wght-normal.woff2?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'google-site-verification', content: site.googleSiteVerification },
      { name: 'theme-color', content: '#0b0b0b' },
    ],
    links: [
      // The text font, fetched early so the first paint already uses it.
      { rel: 'preload', href: bodyFont, as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
      { rel: 'stylesheet', href: styles },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'alternate', type: 'application/atom+xml', title: site.title, href: '/feed.xml' },
    ],
  }),
  shellComponent: Shell,
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
  notFoundComponent: () => (
    <Layout>
      <NotFound />
    </Layout>
  ),
})

function Shell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
