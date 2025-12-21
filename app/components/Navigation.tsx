'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="nav">
      <div className="nav-container">
        <Link href="/" className="logo">
          SARCASM WIKI
        </Link>
        
        <div className={`nav-links ${isMenuOpen ? 'mobile-open' : ''}`}>
          <Link href="/" className="nav-link">
            Home
          </Link>
          <Link href="/showcase" className="nav-link">
            Showcase
          </Link>
          <Link href="/admin" className="nav-link">
            Admin
          </Link>
          <Link href="/sitemap.xml" className="nav-link">
            Sitemap
          </Link>
        </div>

        <button 
          className={`mobile-menu-btn ${isMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  )
}