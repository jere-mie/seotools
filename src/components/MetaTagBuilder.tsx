import { useState, useCallback } from 'react'

interface MetaForm {
  title:       string
  description: string
  url:         string
  canonicalUrl: string
  ogImageUrl:  string
  siteName:    string
  twitterHandle: string
}

const INIT: MetaForm = {
  title:         '',
  description:   '',
  url:           '',
  canonicalUrl:  '',
  ogImageUrl:    '',
  siteName:      '',
  twitterHandle: '',
}

function trunc(s: string, n: number) {
  return s.length <= n ? s : s.slice(0, n) + '...'
}

function isValidUrl(s: string) {
  try { new URL(s); return true } catch { return false }
}

function safePath(url: string) {
  try { return new URL(url).pathname.slice(1) || '' } catch { return '' }
}

function domain(url: string) {
  try { return new URL(url).hostname } catch { return url || 'example.com' }
}

function CharCounter({ value, max }: { value: string; max: number }) {
  const over  = value.length > max
  const warn  = !over && value.length > max * 0.85
  const color = over ? 'var(--accent)' : warn ? '#D97706' : 'var(--success)'
  return <span style={{ fontSize: '0.72rem', color, fontFamily: 'var(--font-mono)' }}>{value.length}/{max}</span>
}

export default function MetaTagBuilder() {
  const [form,    setForm]    = useState<MetaForm>(INIT)
  const [preview, setPreview] = useState<'google' | 'social'>('google')
  const [copied,  setCopied]  = useState(false)

  const set = useCallback((k: keyof MetaForm, v: string) =>
    setForm(f => ({ ...f, [k]: v })), [])

  // --- Generated meta tags ---
  const tag  = (name: string, content: string) => `<meta name="${name}" content="${content}">`
  const prop = (property: string, content: string) => `<meta property="${property}" content="${content}">`
  const tw   = (name: string, content: string) => `<meta name="twitter:${name}" content="${content}">`

  const handle = form.twitterHandle
    ? (form.twitterHandle.startsWith('@') ? form.twitterHandle : '@' + form.twitterHandle)
    : ''

  const lines: string[] = []
  if (form.title)         lines.push(`<title>${form.title}</title>`)
  if (form.description)   lines.push(tag('description', form.description))
  const canonical = form.canonicalUrl || form.url
  if (canonical)          lines.push(`<link rel="canonical" href="${canonical}">`)

  lines.push('')
  lines.push('<!-- Open Graph -->')
  if (form.title)         lines.push(prop('og:title',       form.title))
  if (form.description)   lines.push(prop('og:description', form.description))
  if (form.url)           lines.push(prop('og:url',         form.url))
  if (form.siteName)      lines.push(prop('og:site_name',   form.siteName))
  if (form.ogImageUrl)    lines.push(prop('og:image',       form.ogImageUrl))
  lines.push(prop('og:type', 'website'))

  lines.push('')
  lines.push('<!-- Twitter Card -->')
  lines.push(tw('card', 'summary_large_image'))
  if (handle)             lines.push(tw('site', handle))
  if (form.title)         lines.push(tw('title', form.title))
  if (form.description)   lines.push(tw('description', form.description))
  if (form.ogImageUrl)    lines.push(tw('image', form.ogImageUrl))

  const metaTags = lines.join('\n')

  const copyAll = async () => {
    await navigator.clipboard.writeText(metaTags)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const displayTitle    = form.title       || 'Page Title'
  const displayDesc     = form.description || 'Your page description will appear here. Keep it under 160 characters for best results in search engines.'
  const displayUrl      = form.url         || 'https://example.com/page'

  return (
    <div>
      <h2 className="section-title">Meta Tag Builder</h2>
      <p className="section-desc">Build SEO and social meta tags with live previews.</p>

      <div className="two-col">
        {/* ── Form ── */}
        <div>
          <div className="field">
            <label className="label">
              Page Title <CharCounter value={form.title} max={60} />
            </label>
            <input
              className="input"
              type="text"
              placeholder="My Awesome Page"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              maxLength={120}
            />
          </div>

          <div className="field">
            <label className="label">
              Description <CharCounter value={form.description} max={160} />
            </label>
            <textarea
              className="input"
              placeholder="A brief description of what this page is about..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
              maxLength={320}
              style={{ minHeight: 80 }}
            />
          </div>

          <div className="field">
            <label className="label">Page URL</label>
            <input
              className="input"
              type="text"
              placeholder="https://example.com/page"
              value={form.url}
              onChange={e => set('url', e.target.value)}
            />
            {form.url && !isValidUrl(form.url) && (
              <div style={{ fontSize: '0.72rem', color: 'var(--accent)', marginTop: 4 }}>
                Enter a full URL starting with https://
              </div>
            )}
          </div>

          <div className="field">
            <label className="label">Canonical URL <span style={{ fontSize: '0.7rem', textTransform: 'none', letterSpacing: 0 }}>(optional, defaults to URL)</span></label>
            <input
              className="input"
              type="text"
              placeholder="https://example.com/page"
              value={form.canonicalUrl}
              onChange={e => set('canonicalUrl', e.target.value)}
            />
            {form.canonicalUrl && !isValidUrl(form.canonicalUrl) && (
              <div style={{ fontSize: '0.72rem', color: 'var(--accent)', marginTop: 4 }}>
                Enter a full URL starting with https://
              </div>
            )}
          </div>

          <div className="field">
            <label className="label">OG / Social Image URL</label>
            <input
              className="input"
              type="text"
              placeholder="https://example.com/og-image.png"
              value={form.ogImageUrl}
              onChange={e => set('ogImageUrl', e.target.value)}
            />
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Recommended: 1200×630 px
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <div className="field">
              <label className="label">Site Name</label>
              <input
                className="input"
                type="text"
                placeholder="My Site"
                value={form.siteName}
                onChange={e => set('siteName', e.target.value)}
              />
            </div>
            <div className="field">
              <label className="label">Twitter Handle</label>
              <input
                className="input"
                type="text"
                placeholder="@handle"
                value={form.twitterHandle}
                onChange={e => set('twitterHandle', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── Preview ── */}
        <div>
          <div className="toggle-group" style={{ marginBottom: '1rem' }}>
            <button
              className={`toggle-item${preview === 'google' ? ' active' : ''}`}
              onClick={() => setPreview('google')}
            >
              Google
            </button>
            <button
              className={`toggle-item${preview === 'social' ? ' active' : ''}`}
              onClick={() => setPreview('social')}
            >
              Social Card
            </button>
          </div>

          {preview === 'google' && (
            <div>
              <div className="serp-preview">
                <div className="serp-origin">
                  <span className="serp-favicon" />
                  {domain(displayUrl)} &rsaquo; {form.url ? safePath(form.url) || 'page' : 'page'}
                </div>
                <div className="serp-title">{trunc(displayTitle, 60)}</div>
                <p className="serp-desc">{trunc(displayDesc, 160)}</p>
              </div>
              <p className="serp-hint">
                Title: up to 60 chars · Description: up to 160 chars
              </p>
            </div>
          )}

          {preview === 'social' && (
            <div className="social-card">
              <div className="social-card-image-wrap">
                {form.ogImageUrl ? (
                  <img src={form.ogImageUrl} alt="OG preview" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                ) : (
                  <div className="social-card-placeholder">
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.375rem', opacity: 0.35 }}>🖼</div>
                    No image URL provided
                  </div>
                )}
              </div>
              <div className="social-card-body">
                <p className="social-card-domain">{domain(displayUrl)}</p>
                <h3 className="social-card-title">{trunc(displayTitle, 70)}</h3>
                <p className="social-card-desc">{trunc(displayDesc, 200)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <hr className="divider" />

      {/* ── Output ── */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-h)', fontFamily: 'var(--font-body)' }}>
            Generated Meta Tags
          </div>
          <button
            className={`btn btn-sm${copied ? ' btn-success' : ''}`}
            onClick={copyAll}
          >
            {copied ? '✓ Copied!' : 'Copy All'}
          </button>
        </div>
        <pre className="code-block">{metaTags}</pre>
      </div>
    </div>
  )
}
