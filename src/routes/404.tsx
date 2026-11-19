import { createFileRoute } from '@tanstack/react-router'
import { site } from '../../site.config.ts'
import { NotFound } from '../components/NotFound.tsx'

// Prerendered as /404.html, which GitHub Pages serves for unknown paths.
export const Route = createFileRoute('/404')({
  head: () => ({
    meta: [
      { title: `Page not found | ${site.title}` },
      { name: 'robots', content: 'noindex' },
      // Read by src/router.tsx, to hydrate this page at any URL.
      { name: 'page-kind', content: 'not-found' },
    ],
  }),
  component: NotFound,
})
