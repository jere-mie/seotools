import { useState, useEffect } from 'react'
import IconGenerator from './components/IconGenerator'
import MetaTagBuilder from './components/MetaTagBuilder'
import DevUtilities from './components/DevUtilities'
import './App.css'

type Tool = 'icons' | 'meta' | 'dev'

const TOOLS: { id: Tool; label: string; num: string; icon: string; desc: string }[] = [
  { id: 'icons', label: 'Icon Generator', num: '01', icon: '◈', desc: 'Favicon & icon suite' },
  { id: 'meta',  label: 'Meta Tags',      num: '02', icon: '◉', desc: 'SEO & Open Graph'    },
  { id: 'dev',   label: 'Dev Utilities',  num: '03', icon: '◎', desc: 'Base64 & Robots.txt' },
]

function App() {
  const [activeTool, setActiveTool] = useState<Tool>('icons')
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('seotools-theme')
      if (saved) return saved === 'dark'
    } catch {}
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', darkMode)
    root.classList.toggle('light', !darkMode)
    try { localStorage.setItem('seotools-theme', darkMode ? 'dark' : 'light') } catch {}
  }, [darkMode])

  const activeName = TOOLS.find(t => t.id === activeTool)?.label ?? ''

  return (
    <div className="app-shell">
      {/* ── Sidebar (desktop) ─────────────────── */}
      <aside className="sidebar" aria-label="Main navigation">
        <div className="sidebar-logo">
          <div className="logo-text"><span className="lo-accent">SEO</span> Tools</div>
          <div className="logo-tagline">Privacy-first toolkit</div>
        </div>

        <nav className="sidebar-nav">
          {TOOLS.map(t => (
            <button
              key={t.id}
              className={`nav-item${activeTool === t.id ? ' active' : ''}`}
              onClick={() => setActiveTool(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={() => setDarkMode(d => !d)}>
            {darkMode ? '☀ Light mode' : '◑ Dark mode'}
          </button>
          <p className="privacy-note">All processing is 100% client-side. No data ever leaves your browser.</p>
          <a
            href="https://github.com/jere-mie/seotools"
            target="_blank"
            rel="noopener noreferrer"
            className="sidebar-link"
            style={{ marginTop: '0.625rem' }}
          >
            GitHub &middot; MIT License
          </a>
          <a
            href="https://jeremie.bornais.ca"
            target="_blank"
            rel="noopener noreferrer"
            className="sidebar-link"
            style={{ marginTop: '0.25rem' }}
          >
            Made by Jeremie Bornais
          </a>
        </div>
      </aside>

      {/* ── Mobile header ─────────────────────── */}
      <header className="mobile-header">
        <div className="logo-text-mobile"><span className="lo-accent">SEO</span> Tools</div>
        <button
          className="theme-toggle-mobile"
          onClick={() => setDarkMode(d => !d)}
          aria-label="Toggle dark mode"
        >
          {darkMode ? '☀' : '◑'}
        </button>
      </header>

      {/* ── Mobile nav tabs ───────────────────── */}
      <div className="mobile-nav" role="tablist">
        {TOOLS.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={activeTool === t.id}
            className={`mobile-nav-item${activeTool === t.id ? ' active' : ''}`}
            onClick={() => setActiveTool(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Main content ──────────────────────── */}
      <main className="main-content" aria-label={activeName}>
        {activeTool === 'icons' && <IconGenerator />}
        {activeTool === 'meta'  && <MetaTagBuilder />}
        {activeTool === 'dev'   && <DevUtilities />}
        <footer style={{
          marginTop: '3rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-muted)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>100% client-side &middot; no server, no tracking</span>
          <a
            href="https://github.com/jere-mie/seotools"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textDecoration: 'none' }}
          >
            GitHub &middot; MIT License
          </a>
        </footer>
      </main>
    </div>
  )
}

export default App
