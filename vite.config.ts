import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { markdownPages } from './plugins/markdown.ts'

export default defineConfig({
  build: {
    // Keep the built scripts apart from the site's own /assets folder.
    assetsDir: '_app',
  },
  plugins: [
    markdownPages(),
    tanstackStart({
      prerender: {
        enabled: true,
        // Start from the home page and follow every link to find the pages.
        crawlLinks: true,
        autoSubfolderIndex: true,
        failOnError: true,
        // The feed and the sitemap are written after the build (scripts/postbuild.ts).
        filter: (page) => !page.path.endsWith('.xml'),
      },
      pages: [{ path: '/404', prerender: { outputPath: '/404.html' } }],
    }),
    viteReact(),
  ],
})
