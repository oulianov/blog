// Site-wide settings (what _config.yml held in the Jekyll version).

export const site = {
  title: 'Nicolas Oulianov',
  url: 'https://nicolasoulianov.com',
  description: 'Tech, data science, programming, and more.',
  twitter: 'nicolasoulianov',
  googleSiteVerification: 'qjQg6MPneG0rp9O4_YHCRl-Bx4IduwZrISrWAlu0O-c',
  // The link preview of every page that has no image of its own.
  defaultImage: {
    path: '/assets/og-default.jpg',
    width: 1200,
    height: 630,
    alt: 'Nicolas Oulianov (oulianov): I build AI products by programming and talking a lot',
  },
  externalLinks: [
    { title: 'GitHub', url: 'https://github.com/oulianov' },
    { title: 'LinkedIn', url: 'https://www.linkedin.com/in/nicolas-oulianov/' },
  ],
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
