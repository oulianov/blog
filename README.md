# Blog

```
bundle exec jekyll serve
```

## Link previews

Every page sets in its front matter a `description` (about 150 characters) and an
`image`: 1200×630, under 300 KB, in `assets/<page>/og.*`, with its `width`, `height`
and `alt`. A page without its own image gets the default card,
`assets/og-default.jpg` (`defaults` in `_config.yml`).
