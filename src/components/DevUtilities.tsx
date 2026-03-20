import { useState, useCallback, useRef } from 'react'

/* ─── Base64 Converter ─────────────────────────────────────── */
function Base64Converter() {
  const [file,     setFile]     = useState<File | null>(null)
  const [dataUri,  setDataUri]  = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [copied,   setCopied]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((f: File) => {
    setError(null)
    if (f.size > 5 * 1024 * 1024) {
      setError('File is too large. Base64 is best suited for small assets (< 5 MB).')
      return
    }
    setFile(f)
    const reader = new FileReader()
    reader.onload  = () => setDataUri(reader.result as string)
    reader.onerror = () => setError('Failed to read file.')
    reader.readAsDataURL(f)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const copy = async () => {
    if (!dataUri) return
    await navigator.clipboard.writeText(dataUri)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const reset = () => { setFile(null); setDataUri(null); setError(null) }

  const sizeKb = file ? (file.size / 1024).toFixed(1) : null
  const b64Kb  = dataUri ? (dataUri.length / 1024).toFixed(1) : null

  return (
    <div className="card">
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: '0.25rem' }}>
        Base64 Converter
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
        Convert any small asset into a Data URI for embedding directly in CSS or HTML.
      </p>

      <div
        className={`dropzone${dragOver ? ' dragover' : ''}`}
        style={{ marginBottom: '1rem', minHeight: 110 }}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        aria-label="Upload file for Base64 conversion"
      >
        <input
          ref={inputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ fontSize: '1.75rem', opacity: 0.6 }}>📄</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-h)', marginBottom: 3 }}>{file.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{file.type || 'unknown type'} - {sizeKb} KB</div>
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '1.875rem', opacity: 0.45, marginBottom: 6 }}>⊕</div>
            <div style={{ fontWeight: 600, color: 'var(--text-h)', marginBottom: 3 }}>Drop any file here</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Images, SVGs, fonts, audio - best under 1 MB</div>
          </>
        )}
      </div>

      {error && (
        <div style={{ padding: '0.5rem 0.75rem', background: 'var(--accent-light)', border: '1px solid var(--accent)', color: 'var(--accent)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          ⚠ {error}
        </div>
      )}

      {dataUri && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Data URI - {b64Kb} KB ({Math.round((dataUri.length / (file!.size * 4 / 3)) * 100 - 100)}% overhead)
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className={`btn btn-sm${copied ? ' btn-success' : ''}`} onClick={copy}>
                {copied ? '✓ Copied!' : 'Copy URI'}
              </button>
              <button className="btn btn-sm btn-ghost" onClick={reset}>Clear</button>
            </div>
          </div>
          <textarea
            readOnly
            value={dataUri}
            className="input"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              height: 96,
              resize: 'vertical',
              lineHeight: 1.5,
            }}
          />
        </>
      )}
    </div>
  )
}

/* ─── Robots.txt Generator ─────────────────────────────────── */
interface RobotsRule {
  id: string
  label: string
  desc: string
  lines: string[]
}

const AI_BOTS: RobotsRule = {
  id: 'aiCrawlers',
  label: 'Block AI crawlers',
  desc: 'Disallows GPTBot, CCBot, Claude-Web, Anthropic and similar AI training crawlers.',
  lines: [
    '',
    '# Block AI training crawlers',
    'User-agent: GPTBot',
    'Disallow: /',
    'User-agent: ChatGPT-User',
    'Disallow: /',
    'User-agent: CCBot',
    'Disallow: /',
    'User-agent: anthropic-ai',
    'Disallow: /',
    'User-agent: Claude-Web',
    'Disallow: /',
    'User-agent: Omgilibot',
    'Disallow: /',
  ],
}

type RuleKey = 'aiCrawlers' | 'admin' | 'api' | 'private'

function buildRobots(opts: {
  allowAll: boolean
  sitemap: string
  rules: Set<RuleKey>
}): string {
  const { allowAll, sitemap, rules } = opts
  const out: string[] = [
    'User-agent: *',
    allowAll ? 'Allow: /' : 'Disallow: /',
  ]

  if (rules.has('admin')) {
    out.push('', '# Block admin panels')
    out.push('User-agent: *')
    out.push('Disallow: /admin/')
    out.push('Disallow: /wp-admin/')
    out.push('Disallow: /wp-login.php')
  }
  if (rules.has('api')) {
    out.push('', '# Block API endpoints')
    out.push('User-agent: *')
    out.push('Disallow: /api/')
  }
  if (rules.has('private')) {
    out.push('', '# Block private content')
    out.push('User-agent: *')
    out.push('Disallow: /private/')
    out.push('Disallow: /draft/')
    out.push('Disallow: /staging/')
  }

  if (rules.has('aiCrawlers')) {
    out.push(...AI_BOTS.lines)
  }

  if (sitemap.trim()) {
    out.push('', `Sitemap: ${sitemap.trim()}`)
  }

  return out.join('\n')
}

function RobotsTxtGenerator() {
  const [allowAll, setAllowAll] = useState(true)
  const [sitemap,  setSitemap]  = useState('')
  const [rules,    setRules]    = useState<Set<RuleKey>>(new Set())
  const [copied,   setCopied]   = useState(false)

  const toggle = (key: RuleKey) => {
    setRules(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const content = buildRobots({ allowAll, sitemap, rules })

  const copy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const download = () => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a = Object.assign(document.createElement('a'), { href: url, download: 'robots.txt' })
    a.click()
    URL.revokeObjectURL(url)
  }

  const OPTIONAL_RULES: { key: RuleKey; label: string; desc: string }[] = [
    { key: 'admin',      label: 'Disallow /admin/',   desc: 'Blocks /admin/, /wp-admin/, /wp-login.php'        },
    { key: 'api',        label: 'Disallow /api/',      desc: 'Prevents crawlers from indexing API routes'       },
    { key: 'private',    label: 'Disallow private',    desc: 'Blocks /private/, /draft/, /staging/'             },
    { key: 'aiCrawlers', label: 'Block AI crawlers',   desc: 'GPTBot, CCBot, anthropic-ai, Claude-Web & more'   },
  ]

  return (
    <div className="card">
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: '0.25rem' }}>
        Robots.txt Generator
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
        Configure access rules and download a ready-to-deploy <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8em', background: 'var(--code-bg)', padding: '0 4px' }}>robots.txt</code>.
      </p>

      <div className="robots-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
        <div>
          {/* Allow / Disallow all */}
          <div style={{ marginBottom: '1rem' }}>
            <div className="label" style={{ marginBottom: '0.5rem' }}>Default access</div>
            <div className="toggle-group">
              <button
                className={`toggle-item${allowAll ? ' active' : ''}`}
                onClick={() => setAllowAll(true)}
              >
                Allow all
              </button>
              <button
                className={`toggle-item${!allowAll ? ' active' : ''}`}
                onClick={() => setAllowAll(false)}
              >
                Disallow all
              </button>
            </div>
          </div>

          {/* Optional rules */}
          <div style={{ marginBottom: '1rem' }}>
            <div className="label" style={{ marginBottom: '0.375rem' }}>Optional rules</div>
            {OPTIONAL_RULES.map(r => (
              <div key={r.key} className="checkbox-row">
                <input
                  type="checkbox"
                  id={`rule-${r.key}`}
                  checked={rules.has(r.key)}
                  onChange={() => toggle(r.key)}
                />
                <label htmlFor={`rule-${r.key}`} style={{ cursor: 'pointer' }}>
                  <div className="checkbox-label">{r.label}</div>
                  <div className="checkbox-desc">{r.desc}</div>
                </label>
              </div>
            ))}
          </div>

          {/* Sitemap */}
          <div className="field">
            <label className="label" htmlFor="sitemap-url">Sitemap URL (optional)</label>
            <input
              id="sitemap-url"
              className="input"
              type="url"
              placeholder="https://example.com/sitemap.xml"
              value={sitemap}
              onChange={e => setSitemap(e.target.value)}
            />
          </div>
        </div>

        {/* Preview */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div className="label" style={{ margin: 0 }}>Preview</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className={`btn btn-sm${copied ? ' btn-success' : ''}`} onClick={copy}>
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
              <button className="btn btn-sm btn-primary" onClick={download}>
                ↓ Download
              </button>
            </div>
          </div>
          <pre className="code-block" style={{ minHeight: 180, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {content}
          </pre>
        </div>
      </div>
    </div>
  )
}

/* ─── DevUtilities page ─────────────────────────────────────── */
export default function DevUtilities() {
  return (
    <div>
      <h2 className="section-title">Dev Utilities</h2>
      <p className="section-desc">
        Quick conversion and generation tools. Everything runs locally in your browser.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Base64Converter />
        <RobotsTxtGenerator />
      </div>
    </div>
  )
}
