declare module 'virtual:pages' {
  import type { PageMeta } from '../plugins/content.ts'
  export const pages: PageMeta[]
}

declare module '*.markdown' {
  import type { RenderedPage } from '../plugins/content.ts'
  const page: RenderedPage
  export default page
}
