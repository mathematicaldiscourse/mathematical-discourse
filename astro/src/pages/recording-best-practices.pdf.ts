import type { APIRoute } from 'astro';
import { serveUpload } from '../lib/mediaAlias';

export const prerender = false;

export const GET: APIRoute = () =>
  serveUpload({ path: '2026/07/Best-practices-for-recording.pdf' });
