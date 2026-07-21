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
