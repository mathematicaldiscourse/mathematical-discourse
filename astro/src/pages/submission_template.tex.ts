import type { APIRoute } from 'astro';
import { serveUpload } from '../lib/mediaAlias';

export const prerender = false;

export const GET: APIRoute = () =>
  serveUpload({
    path: '2026/08/submission_template.tex',
    // WordPress reports text/plain with no charset, which leaves the browser to guess
    // the encoding and mangle any non-ASCII in the template. Say it explicitly.
    contentType: 'text/plain; charset=utf-8',
  });
