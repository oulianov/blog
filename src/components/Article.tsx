import { useEffect, useRef, type MouseEvent } from 'react'
import { useRouter } from '@tanstack/react-router'

/** The rendered Markdown of a page, with copy buttons on code and live tweets. */
export function Article({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Links to other pages of the site open without a full page load.
  const onClick = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const link = (event.target as Element).closest('a')
    if (!link || link.target || link.hasAttribute('download')) return
    const url = new URL(link.href, window.location.href)
    if (url.origin !== window.location.origin || url.pathname.startsWith('/assets/') || url.pathname.endsWith('.xml')) return
    if (url.pathname === window.location.pathname && url.hash) return
    event.preventDefault()
    router.navigate({ href: url.pathname + url.search + url.hash })
  }

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const buttons: HTMLButtonElement[] = []
    for (const pre of element.querySelectorAll('pre')) {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'copy'
      button.textContent = 'Copy'
      button.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(pre.querySelector('code')?.innerText ?? pre.innerText)
          button.textContent = 'Copied'
        } catch {
          button.textContent = 'Press ⌘C'
        }
        setTimeout(() => (button.textContent = 'Copy'), 1600)
      })
      pre.append(button)
      buttons.push(button)
    }

    // Embedded tweets need Twitter's script; Markdown scripts don't run on their own.
    if (element.querySelector('blockquote.twitter-tweet')) {
      const twttr = (window as { twttr?: { widgets?: { load: (el: Element) => void } } }).twttr
      if (twttr?.widgets) twttr.widgets.load(element)
      else if (!document.querySelector('script[src="https://platform.twitter.com/widgets.js"]')) {
        const script = document.createElement('script')
        script.src = 'https://platform.twitter.com/widgets.js'
        script.async = true
        document.body.append(script)
      }
    }

    return () => buttons.forEach((button) => button.remove())
  }, [html])

  return <div ref={ref} className="markdown" onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />
}
