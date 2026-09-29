# Mathematical Discourse — Frontend

The web frontend for Mathematical Discourse, a peer-reviewed video journal for mathematical research talks.

Built with Astro, Svelte, and Tailwind CSS. Content is authored in a separate headless CMS and the site is rendered as static pages.

## Development

Requires Node.js 22.

```
cd astro
nvm use
npm install
npm run dev
```

The dev server runs at `http://localhost:4321`.

Configuration is supplied through environment variables — see `astro/.env.example` for the required keys.

## Deployment

Vercel builds production from `main`. To ship a change, merge its PR into `main`; each PR also gets a Vercel preview deploy for checking beforehand. Avoid Vercel's "Promote to Production" on a preview build — the change won't be on `main`, so the next deploy from `main` will drop it.

## Standalone pages

Self-contained HTML files in `astro/public/` are served as-is at the site root, outside the Astro layouts and the sitemap.

- `talk-feedback-form.html` — the referee talk feedback form, live at `/talk-feedback-form.html`. Referees fill it in and download a PDF (generated in the browser with jsPDF) to upload to Editflow; nothing is sent to a server. It loads jsPDF and the DejaVu Sans fonts from jsDelivr with pinned versions and integrity hashes, so the hashes must be updated if those versions change. It carries a `noindex, nofollow` tag to keep it out of search results until we decide to make it discoverable. It's intentionally not blocked in `robots.txt`, because crawlers need to fetch the page to see that tag.
