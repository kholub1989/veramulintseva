# Vera Mulintseva — Portfolio Site

A static single-page portfolio site for [Vera Mulintseva](https://www.veramulintseva.com/), an NYC-based UGC creator. Built with vanilla HTML/CSS/JS, bundled with [Vite](https://vitejs.dev/) — no frontend framework.

## Getting started

Requires Node `22.12.0` (see `.nvmrc`).

```bash
npm install
npm run dev       # dev server
npm run build     # production build to dist/
npm run preview   # preview the production build
```

## Structure

- `index.html` — all page content (hero, portfolio, photo grid, about, services, process, FAQ, contact), single file, no templating.
- `src/main.js` — page behavior: mobile nav, video category filtering/pagination, lazy video/poster loading, footer year.
- `src/css/styles.css` — single stylesheet, organized section-by-section to match `index.html`. Uses CSS custom properties in `:root` — reuse those instead of hardcoding new values.
- `public/` — static assets (videos, images, favicons, SEO files), served as-is with root-relative paths (`/videos/...`, `/images/...`).

There's no test suite, linter, or type checker — verify changes by eye in the dev server.

## Deployment

Hosted on Netlify, deploys automatically on push to `main`. Build settings live in the Netlify dashboard (no `netlify.toml` in this repo).
