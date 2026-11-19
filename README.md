# Blog

The source of [nicolasoulianov.com](https://nicolasoulianov.com): Vite and TanStack Start,
prerendered to static HTML and hosted on GitHub Pages.

```
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # static site in dist/client
pnpm preview    # serve dist/client
```

## Pages

The pages are Markdown files: `index.markdown` (the home page) and `docs/*.markdown`.
A file `docs/robotics.markdown` is served at `/docs/robotics/`. Pictures go in
`public/assets/`, and are linked as `/assets/...`.

The Markdown is the same as in the Jekyll version: front matter (`title`, `nav_order`,
`description`, `image`, `date`), `{% include youtubePlayer.html id="..." %}`,
`{% include video.html src="..." %}`, Kramdown attributes such as
`[Download](url){: .btn .btn-primary }` and `![Alt](src){: width="200" }`, and math
between `$$`. `plugins/content.ts` turns it into HTML at build time.

Pages are listed in the sidebar by `nav_order`. They take the four colors in turn
(pink, green, orange, blue) and a turning shape; a page can pick its own with `color:`
and `shape:` in its front matter (see `site.config.ts`).

## Link previews

Every page sets in its front matter a `description` (about 150 characters) and an
`image`: 1200×630, under 300 KB, in `public/assets/<page>/og.*`, with its `width`,
`height` and `alt`. A page without its own image gets the default card,
`public/assets/og-default.jpg` (`defaultImage` in `site.config.ts`).

## Deploy

Pushing to `main` builds the site and deploys `dist/client` to GitHub Pages
(`.github/workflows/pages.yml`). `pnpm build` also writes `sitemap.xml`, `feed.xml` and
`404.html`.
