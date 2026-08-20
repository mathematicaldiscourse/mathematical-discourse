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

  // `content-length`/`etag` are deliberately omitted: `fetch` negotiates gzip with
  // WordPress and transparently decompresses the body, so those headers describe the
  // compressed representation and would truncate text uploads (.tex, .svg, .csv) at
  // the compressed length. Binary uploads were unaffected only because they aren't gzipped.
  const headers = new Headers();
  for (const h of ['content-type', 'last-modified', 'content-disposition']) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  headers.set('cache-control', 'public, max-age=3600, s-maxage=86400');

  return new Response(upstream.body, { status: upstream.status, headers });
};
