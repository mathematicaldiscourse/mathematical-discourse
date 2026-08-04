import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  const wpUrl = import.meta.env.WP_URL;
  const path = params.path ?? '';
  const search = new URL(request.url).search;
  const target = `${wpUrl}/wp-content/uploads/${path}${search}`;

  const upstream = await fetch(target, {
    headers: { Accept: '*/*', 'User-Agent': 'md-media-proxy' },
  });

  const headers = new Headers();
  for (const h of ['content-type', 'content-length', 'last-modified', 'etag', 'content-disposition']) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  headers.set('cache-control', 'public, max-age=3600, s-maxage=86400');

  return new Response(upstream.body, { status: upstream.status, headers });
};
