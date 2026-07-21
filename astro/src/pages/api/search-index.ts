import type { APIRoute } from 'astro';
import { fetchSearchIndex } from '../../lib/wordpress';

export const prerender = true;

export const GET: APIRoute = async () => {
  const index = await fetchSearchIndex();
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json' },
  });
};
