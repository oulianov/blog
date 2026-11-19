// Site-wide settings (what _config.yml held in the Jekyll version).

export const site = {
  title: 'Nicolas Oulianov',
  url: 'https://nicolasoulianov.com',
  description: 'Stories and notes on maths, data science and programming.',
  // The home page's title, in search results and link previews.
  homeTitle: 'Nicolas Oulianov — I build AI products',
  twitter: 'nicolasoulianov',
  // Who writes the site: the Person of the structured data, with the
  // profiles of externalLinks as sameAs.
  author: {
    name: 'Nicolas Oulianov',
    alternateName: 'oulianov',
    jobTitle: 'Software developer',
    image: '/assets/face_crop_hq2.png',
  },
  googleSiteVerification: 'qjQg6MPneG0rp9O4_YHCRl-Bx4IduwZrISrWAlu0O-c',
  // The link preview of every page that has no image of its own.
  defaultImage: {
    path: '/assets/og-default.jpg',
    width: 1200,
    height: 630,
    alt: 'Nicolas Oulianov (oulianov): I build AI products by programming and talking a lot',
  },
  // In the sidebar, and as icons under the contact line of the home page.
  externalLinks: [
    { title: 'GitHub', url: 'https://github.com/oulianov', icon: 'github' },
    { title: 'LinkedIn', url: 'https://www.linkedin.com/in/nicolas-oulianov/', icon: 'linkedin' },
    { title: 'X', url: 'https://x.com/nicolasoulianov', icon: 'x' },
  ] as const,
}

// The four colors, one per season: pink is spring, green summer,
// orange autumn and blue winter. Pages take them in turn, by nav order.
export const palette = {
  pink: '#ea4f9b',
  green: '#9ccb3b',
  orange: '#fbb02a',
  blue: '#1d9ad9',
} as const

export type ColorName = keyof typeof palette

export const colorCycle: ColorName[] = ['pink', 'green', 'orange', 'blue']

// The black models that turn in the page headers. Each has one white detail.
export type ShapeName =
  | 'laptop' // white screen
  | 'headphones' // white cushions
  | 'gamepad' // white cross and buttons
  | 'sync' // white arrowhead
  | 'robot' // white eyes
  | 'arcade' // white screen
  | 'pin' // white dot
  | 'book' // white pages
  | 'microphone' // white ring

// The model of each page, by slug ("" is the home page). A page can pick
// another one with `shape:` in its front matter.
export const shapeBySlug: Record<string, ShapeName> = {
  '': 'laptop',
  neuralanalog: 'headphones',
  easyrpg_editor: 'gamepad',
  rpgsync: 'sync',
  robotics: 'robot',
  llm_colosseum: 'arcade',
  optimization: 'pin',
  nlp: 'book',
  podcasts: 'microphone',
}
