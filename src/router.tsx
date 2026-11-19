import { createRouter, type LocationRewrite } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

/**
 * GitHub Pages serves 404.html (prerendered from /404/) at any unknown URL.
 * In the browser, that page reads its own URL as /404/, so it hydrates the
 * page it was rendered from, while the address bar keeps the URL typed.
 */
function notFoundRewrite(): LocationRewrite | undefined {
  if (typeof document === 'undefined') return undefined
  if (!document.querySelector('meta[name="page-kind"][content="not-found"]')) return undefined
  const missingPath = window.location.pathname
  if (missingPath === '/404/' || missingPath === '/404') return undefined
  return {
    input: ({ url }) => {
      if (url.pathname !== missingPath) return undefined
      url.pathname = '/404/'
      return url
    },
    output: ({ url }) => {
      if (url.pathname !== '/404/') return undefined
      url.pathname = missingPath
      return url
    },
  }
}

export function getRouter() {
  return createRouter({
    routeTree,
    // The pages live at /docs/nlp/, with a trailing slash, as on the Jekyll site.
    trailingSlash: 'always',
    scrollRestoration: true,
    defaultPreload: 'intent',
    rewrite: notFoundRewrite(),
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
