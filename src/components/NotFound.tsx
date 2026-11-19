import type { CSSProperties } from 'react'
import { Link } from '@tanstack/react-router'
import { palette } from '../../site.config.ts'
import { Silhouette } from './Silhouette.tsx'

export function NotFound() {
  return (
    <header className="hero" data-silhouette-area style={{ '--page-color': palette.orange } as CSSProperties}>
      <div className="hero-text">
        <h1 className="hero-title">404</h1>
        <p>This page could not be found.</p>
        <p>
          <Link to="/" className="btn btn-primary">
            Back home
          </Link>
        </p>
      </div>
      <div className="hero-art">
        <Silhouette shapes={['pin']} label="A big black map pin turning on orange. Click it or drag it." />
      </div>
    </header>
  )
}
