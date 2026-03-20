# SEO Tools

A privacy-first, single-page SEO and branding toolkit. Every operation runs entirely in the browser using the Canvas API and browser-native file utilities - no server, no uploads, no data collection.

License: MIT

## Features

### Icon Generator
Upload any PNG, JPG, or SVG and get a complete icon suite in one click:
- Resizes to 16x16, 32x32, 180x180 (Apple Touch), 192x192, and 512x512 (PWA)
- Generates a proper `favicon.ico` containing 16px and 32px variants
- Generates a `site.webmanifest` ready for PWA use
- Downloads everything as a single ZIP file
- Per-icon Base64 / Data URI toggle for inline embedding
- Copyable HTML `<link>` snippet with correct `rel` attributes

### Meta Tag Builder
Fill in a form, get production-ready meta tags:
- Real-time Google SERP preview with character count warnings (60/160 limits)
- Social card preview (Open Graph / Twitter card)
- Generates `<title>`, `<meta name="description">`, `<link rel="canonical">`, full Open Graph block, and Twitter Card block
- Copy-all button for the complete output

### Dev Utilities
- **Base64 Converter** - drag and drop any file to get an instant Data URI with size overhead info
- **Robots.txt Generator** - toggle-based UI for common rules (allow all, block admin, block API, block AI crawlers), live preview, copy and download

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS v4
- JSZip (client-side ZIP generation)
- Browser Canvas API (image resizing)
- Browser FileReader API (file reading + Base64)

## Getting Started

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Privacy

All file processing happens in the browser using the Canvas API and FileReader API. No images, files, or form data are ever sent to any server. There is no analytics, no telemetry, and no backend.

## Browser Support

Any modern browser that supports the Canvas API and FileReader API (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+).

