import { useEffect, useRef } from 'react'
import type { ShapeName } from '../../site.config.ts'

interface SilhouetteProps {
  /** The models; with several, a click swaps to the next one. */
  shapes: ShapeName[]
  /** Accessible description; leave it out when the model is decoration. */
  label?: string
  /** Clicks and drags move the model (off for tiles that are links). */
  interactive?: boolean
  hopOnHover?: boolean
  onSwap?: (index: number) => void
  /** A photo for the models' photo spots (my face, on the home page). */
  photo?: string
}

/**
 * A black 3D model on a flat color, with one white detail.
 * The 3D code loads once the frame is near the screen and the browser is idle.
 */
export function Silhouette({ shapes, label, interactive = true, hopOnHover = false, onSwap, photo }: SilhouetteProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onSwapRef = useRef(onSwap)
  onSwapRef.current = onSwap
  const key = shapes.join(',')

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let dispose: (() => void) | undefined
    let cancelled = false

    const mount = () =>
      import('./scene.ts').then(({ mountScene }) => {
        if (cancelled) return
        try {
          dispose = mountScene(container, {
            shapes: key.split(',') as ShapeName[],
            interactive,
            hopOnHover,
            onSwap: (index) => onSwapRef.current?.(index),
            photo,
          })
        } catch {
          // No WebGL: the flat color stays on its own.
        }
      })

    // Start once the browser is idle, so the page loads and responds first.
    // (Safari has no requestIdleCallback: a short timeout stands in.)
    const hasIdle = typeof window.requestIdleCallback === 'function'
    let idle = 0
    const whenIdle = (callback: () => void) =>
      hasIdle ? window.requestIdleCallback(callback, { timeout: 2000 }) : window.setTimeout(callback, 200)
    const cancelIdle = (id: number) => (hasIdle ? window.cancelIdleCallback(id) : window.clearTimeout(id))

    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        near.disconnect()
        idle = whenIdle(() => void mount())
      },
      { rootMargin: '400px' },
    )
    near.observe(container)

    return () => {
      cancelled = true
      near.disconnect()
      cancelIdle(idle)
      dispose?.()
    }
  }, [key, interactive, hopOnHover, photo])

  return (
    <div
      ref={containerRef}
      className="silhouette"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    />
  )
}
