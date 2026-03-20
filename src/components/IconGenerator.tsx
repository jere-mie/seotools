import { useState, useCallback, useRef, useEffect } from 'react'
import JSZip from 'jszip'
import { encodeIco } from '../utils/icoEncoder'

const SIZES = [
  { key: 'favicon-16',  label: '16×16',    w: 16,  h: 16,  file: 'favicon-16x16.png',           note: 'Browser tab'     },
  { key: 'favicon-32',  label: '32×32',    w: 32,  h: 32,  file: 'favicon-32x32.png',           note: 'Taskbar / HD'    },
  { key: 'apple-touch', label: '180×180',  w: 180, h: 180, file: 'apple-touch-icon.png',        note: 'Apple devices'   },
  { key: 'android-192', label: '192×192',  w: 192, h: 192, file: 'android-chrome-192x192.png',  note: 'Android / PWA'   },
  { key: 'pwa-512',     label: '512×512',  w: 512, h: 512, file: 'android-chrome-512x512.png',  note: 'PWA splash'      },
]

interface IconResult {
  blob: Blob
  dataUrl: string
  width: number
  height: number
  filename: string
}

function resizeToBlob(img: HTMLImageElement, w: number, h: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width  = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) { reject(new Error('Canvas unsupported')); return }
    // object-fit: contain
    const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight)
    const sw = img.naturalWidth  * scale
    const sh = img.naturalHeight * scale
    ctx.drawImage(img, (w - sw) / 2, (h - sh) / 2, sw, sh)
    canvas.toBlob(
      b => b ? resolve(b) : reject(new Error('toBlob failed')),
      'image/png'
    )
  })
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload  = () => resolve(r.result as string)
    r.onerror = () => reject(new Error('FileReader failed'))
    r.readAsDataURL(blob)
  })
}

const FILE_SNIPPET = `<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32">
<link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`

function buildManifest(name: string, shortName: string): string {
  return JSON.stringify({
    name,
    short_name: shortName,
    icons: [
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    theme_color: '#ffffff',
    background_color: '#ffffff',
    display: 'standalone',
  }, null, 2)
}

export default function IconGenerator() {
  const [file,         setFile]        = useState<File | null>(null)
  const [preview,      setPreview]     = useState<string | null>(null)
  const [isGenerating, setGenerating]  = useState(false)
  const [results,      setResults]     = useState<Map<string, IconResult> | null>(null)
  const [showB64,      setShowB64]     = useState<Set<string>>(new Set())
  const [manifestName,  setManifestName]  = useState('')
  const [manifestShort, setManifestShort] = useState('')
  const [icoBlob,       setIcoBlob]       = useState<Blob | null>(null)
  const [snippetMode,   setSnippetMode]   = useState<'files' | 'base64'>('files')
  const [dragOver,      setDragOver]      = useState(false)
  const [copied,       setCopied]      = useState<string | null>(null)
  const [error,        setError]       = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) { setError('Please upload an image file (PNG, JPG, SVG).'); return }
    setError(null)
    setFile(f)
    const url = URL.createObjectURL(f)
    setPreview(prev => { if (prev) URL.revokeObjectURL(prev); return url })
    setResults(null)
    setIcoBlob(null)
    setShowB64(new Set())
  }, [])

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const generate = useCallback(async () => {
    if (!file) return
    setGenerating(true)
    setError(null)
    setIcoBlob(null)
    try {
      const img = new Image()
      const objUrl = URL.createObjectURL(file)
      await new Promise<void>((res, rej) => {
        img.onload  = () => res()
        img.onerror = () => rej(new Error('Failed to load image'))
        img.src = objUrl
      })
      const map = new Map<string, IconResult>()
      for (const sz of SIZES) {
        const blob    = await resizeToBlob(img, sz.w, sz.h)
        const dataUrl = await blobToDataUrl(blob)
        map.set(sz.key, { blob, dataUrl, width: sz.w, height: sz.h, filename: sz.file })
      }
      URL.revokeObjectURL(objUrl)
      const r16 = map.get('favicon-16')
      const r32 = map.get('favicon-32')
      if (r16 && r32) {
        const [a16, a32] = await Promise.all([
          r16.blob.arrayBuffer().then(b => new Uint8Array(b)),
          r32.blob.arrayBuffer().then(b => new Uint8Array(b)),
        ])
        setIcoBlob(new Blob([encodeIco([
          { data: a16, width: 16, height: 16 },
          { data: a32, width: 32, height: 32 },
        ]).buffer as ArrayBuffer], { type: 'image/x-icon' }))
      }
      setResults(map)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed.')
    } finally {
      setGenerating(false)
    }
  }, [file])

  const downloadSingle = useCallback((key: string) => {
    const r = results?.get(key)
    if (!r) return
    const url = URL.createObjectURL(r.blob)
    const a = Object.assign(document.createElement('a'), { href: url, download: r.filename })
    a.click()
    URL.revokeObjectURL(url)
  }, [results])

  const downloadAll = useCallback(async () => {
    if (!results) return
    const zip = new JSZip()

    for (const sz of SIZES) {
      const r = results.get(sz.key)
      if (r) zip.file(r.filename, r.blob)
    }

    if (icoBlob) zip.file('favicon.ico', icoBlob)

    zip.file('site.webmanifest', buildManifest(manifestName, manifestShort))
    zip.file('icons-snippet.html', FILE_SNIPPET)

    const blob = await zip.generateAsync({ type: 'blob' })
    const url  = URL.createObjectURL(blob)
    const a = Object.assign(document.createElement('a'), { href: url, download: 'seotools-icons.zip' })
    a.click()
    URL.revokeObjectURL(url)
  }, [results, icoBlob, manifestName, manifestShort])

  const toggleB64 = useCallback((key: string) => {
    setShowB64(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }, [])

  const copy = useCallback(async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(c => c === key ? null : c), 2000)
  }, [])

  const buildB64Snippet = useCallback((): string => {
    if (!results) return ''
    const r16  = results.get('favicon-16')
    const r32  = results.get('favicon-32')
    const r180 = results.get('apple-touch')
    const lines = ['<!-- Base64 encoded icons (no server files needed) -->']
    if (r32)  lines.push(`<link rel="icon" href="${r32.dataUrl}" type="image/png" sizes="32x32">`)
    if (r16)  lines.push(`<link rel="icon" href="${r16.dataUrl}" type="image/png" sizes="16x16">`)
    if (r180) lines.push(`<link rel="apple-touch-icon" href="${r180.dataUrl}">`)
    return lines.join('\n')
  }, [results])

  const downloadIco = useCallback(() => {
    if (!icoBlob) return
    const url = URL.createObjectURL(icoBlob)
    const a = Object.assign(document.createElement('a'), { href: url, download: 'favicon.ico' })
    a.click()
    URL.revokeObjectURL(url)
  }, [icoBlob])

  const downloadManifest = useCallback(() => {
    const content = buildManifest(manifestName, manifestShort)
    const blob = new Blob([content], { type: 'application/manifest+json' })
    const url  = URL.createObjectURL(blob)
    const a = Object.assign(document.createElement('a'), { href: url, download: 'site.webmanifest' })
    a.click()
    URL.revokeObjectURL(url)
  }, [manifestName, manifestShort])

  return (
    <div>
      <h2 className="section-title">Icon Generator</h2>
      <p className="section-desc">
        Upload any image to generate a complete favicon &amp; icon suite - including .ico, webmanifest, and HTML snippet.
      </p>

      {/* ── Drop zone ── */}
      <div
        className={`dropzone${dragOver ? ' dragover' : ''}`}
        style={{ marginBottom: '1.5rem', minHeight: 140 }}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        aria-label="Upload image"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        {preview && file ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <img
              src={preview}
              alt="Source"
              style={{
                maxWidth: 72, maxHeight: 72,
                border: '2px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
                imageRendering: 'auto',
              }}
            />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-h)', marginBottom: 4 }}>{file.name}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                {(file.size / 1024).toFixed(1)} KB - click or drop to replace
              </div>
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '2.25rem', lineHeight: 1, marginBottom: 8, color: 'var(--border-muted)' }}>⊕</div>
            <div style={{ fontWeight: 600, color: 'var(--text-h)', marginBottom: 4 }}>Drop an image here</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>PNG, JPG, SVG - or click to browse</div>
          </>
        )}
      </div>

      {error && (
        <div style={{ padding: '0.625rem 0.875rem', background: 'var(--accent-light)', border: '2px solid var(--accent)', color: 'var(--accent)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          ⚠ {error}
        </div>
      )}

      {/* ── Generate button ── */}
      {file && !results && (
        <div style={{ marginBottom: '1.5rem' }}>
          <button className="btn btn-primary" onClick={generate} disabled={isGenerating}>
            {isGenerating ? 'Generating...' : '⟳ Generate Icons'}
          </button>
        </div>
      )}

      {/* ── Results ── */}
      {results && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.125rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-h)' }}>
              Generated Icons
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={downloadAll} style={{ fontSize: '0.875rem' }}>
                ↓ Download All (ZIP)
              </button>
              <button className="btn btn-sm btn-ghost" onClick={generate}>
                ↻ Regenerate
              </button>
            </div>
          </div>

          <div className="icon-grid" style={{ marginBottom: '1.75rem' }}>
            {icoBlob && results?.get('favicon-32') && (
              <div className="card" style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.625rem' }}>
                <div style={{
                  width: 64, height: 64,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 0 0 / 10px 10px',
                  border: '1px solid var(--border-muted)',
                  flexShrink: 0,
                }}>
                  <img
                    src={results.get('favicon-32')!.dataUrl}
                    alt="favicon.ico preview"
                    style={{ maxWidth: '100%', maxHeight: '100%', imageRendering: 'pixelated' }}
                  />
                </div>
                <span className="badge">favicon.ico</span>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>16 + 32px combined</div>
                <button className="btn btn-sm btn-ghost" style={{ width: '100%' }} onClick={downloadIco}>
                  &#x2193; ICO
                </button>
              </div>
            )}
            {SIZES.map(sz => {
              const r = results.get(sz.key)
              if (!r) return null
              const b64Open = showB64.has(sz.key)
              return (
                <div key={sz.key} className="card" style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.625rem' }}>
                  {/* Checkerboard preview */}
                  <div style={{
                    width: 64, height: 64,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 0 0 / 10px 10px',
                    border: '1px solid var(--border-muted)',
                    flexShrink: 0,
                  }}>
                    <img
                      src={r.dataUrl}
                      alt={sz.label}
                      style={{
                        maxWidth: '100%', maxHeight: '100%',
                        imageRendering: sz.w <= 32 ? 'pixelated' : 'auto',
                      }}
                    />
                  </div>

                  <span className="badge">{sz.label}</span>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>{sz.note}</div>

                  <div style={{ display: 'flex', gap: '0.375rem', width: '100%' }}>
                    <button
                      className="btn btn-sm btn-ghost"
                      style={{ flex: 1 }}
                      onClick={() => downloadSingle(sz.key)}
                      title={`Download ${sz.file}`}
                    >
                      ↓ PNG
                    </button>
                    <button
                      className={`btn btn-sm${b64Open ? ' btn-primary' : ' btn-ghost'}`}
                      style={{ flex: 1 }}
                      onClick={() => toggleB64(sz.key)}
                      title="Toggle Base64"
                    >
                      B64
                    </button>
                  </div>

                  {b64Open && (
                    <div style={{ width: '100%' }}>
                      <textarea
                        readOnly
                        value={r.dataUrl}
                        className="input"
                        style={{ fontSize: '0.6rem', height: 56, resize: 'none', padding: '0.375rem', fontFamily: 'var(--font-mono)', lineHeight: 1.4 }}
                      />
                      <button
                        className={`btn btn-sm${copied === sz.key + '-b64' ? ' btn-success' : ''}`}
                        style={{ width: '100%', marginTop: 4 }}
                        onClick={() => copy(r.dataUrl, sz.key + '-b64')}
                      >
                        {copied === sz.key + '-b64' ? '✓ Copied!' : 'Copy Base64'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* HTML Snippet */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-h)', fontFamily: 'var(--font-body)' }}>
                HTML Snippet
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="toggle-group">
                  <button
                    className={`toggle-item${snippetMode === 'files' ? ' active' : ''}`}
                    style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                    onClick={() => setSnippetMode('files')}
                  >
                    File paths
                  </button>
                  <button
                    className={`toggle-item${snippetMode === 'base64' ? ' active' : ''}`}
                    style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}
                    onClick={() => setSnippetMode('base64')}
                  >
                    Base64
                  </button>
                </div>
                <button
                  className={`btn btn-sm${copied === 'html' ? ' btn-success' : ''}`}
                  onClick={() => copy(snippetMode === 'files' ? FILE_SNIPPET : buildB64Snippet(), 'html')}
                >
                  {copied === 'html' ? '\u2713 Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            {snippetMode === 'base64' && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.625rem', padding: '0.375rem 0.625rem', background: 'var(--code-bg)', borderLeft: '3px solid var(--border-muted)' }}>
                Icons are embedded directly as Data URIs. No server files needed, but increases HTML size.
              </div>
            )}
            <pre className="code-block" style={{ wordBreak: snippetMode === 'base64' ? 'break-all' : 'normal', whiteSpace: snippetMode === 'base64' ? 'pre-wrap' : 'pre' }}>
              {snippetMode === 'files' ? FILE_SNIPPET : buildB64Snippet()}
            </pre>
          </div>

          {/* Webmanifest */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-h)', fontFamily: 'var(--font-body)' }}>
                site.webmanifest
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className={`btn btn-sm${copied === 'manifest' ? ' btn-success' : ''}`}
                  onClick={() => copy(buildManifest(manifestName, manifestShort), 'manifest')}
                >
                  {copied === 'manifest' ? '\u2713 Copied!' : 'Copy'}
                </button>
                <button className="btn btn-sm btn-primary" onClick={downloadManifest}>
                  &#x2193; Download
                </button>
              </div>
            </div>
            <div className="two-col" style={{ marginBottom: '0.75rem' }}>
              <div className="field">
                <label className="label" htmlFor="manifest-name">App name</label>
                <input
                  id="manifest-name"
                  className="input"
                  type="text"
                  placeholder="My Awesome App"
                  value={manifestName}
                  onChange={e => setManifestName(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="manifest-short">Short name</label>
                <input
                  id="manifest-short"
                  className="input"
                  type="text"
                  placeholder="MyApp"
                  value={manifestShort}
                  onChange={e => setManifestShort(e.target.value)}
                />
              </div>
            </div>
            <pre className="code-block">{buildManifest(manifestName, manifestShort)}</pre>
          </div>
        </>
      )}
    </div>
  )
}
