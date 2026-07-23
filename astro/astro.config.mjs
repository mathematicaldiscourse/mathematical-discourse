import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

const { WP_URL } = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), '');
const wpUrl = WP_URL ? new URL(WP_URL) : null;

export default defineConfig({
  site: 'https://www.mathematicaldiscourse.org',
  output: 'server',
  adapter: vercel({
    imageService: true,
  }),
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
