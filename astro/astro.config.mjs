// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// Derive the WordPress host from WP_URL (set in astro/.env locally and in
// Vercel's env settings) so the CMS URL isn't hardcoded in this file. At launch,
// changing WP_URL updates the image allowlist automatically.
const { WP_URL } = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), '');
const wpUrl = WP_URL ? new URL(WP_URL) : null;

export default defineConfig({
  // `site` drives every absolute URL (sitemap, RSS, OG, canonical). Point it at
  // the current production deployment. Swap to the real domain at go-live.
  site: 'https://mathematical-discourse-sable.vercel.app',
  output: 'server',
  adapter: vercel({
    imageService: true,
  }),
  // Allow Vercel's image optimizer to fetch images served by the WordPress
  // backend, using whatever host WP_URL points at.
  image: {
    remotePatterns: wpUrl
      ? [{ protocol: wpUrl.protocol.replace(':', ''), hostname: wpUrl.hostname }]
      : [],
  },
  integrations: [svelte(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
