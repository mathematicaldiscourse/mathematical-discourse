/**
 * Serves a WordPress upload under a short, stable URL at the site root.
 *
 * The uploads themselves stay in WordPress so editors keep control of them, but
 * the date-based `/wp-content/uploads/2026/08/...` path is an upload-time
 * artifact and makes for an ugly link. Each alias route below pins one upload
 * to a pretty path and proxies the bytes, so the tidy URL is what stays in the
 * address bar.
 */

interface AliasOptions {
  /** Upload path relative to `/wp-content/uploads/`, e.g. `2026/08/paper.tex`. */
  path: string;
  /**
   * Overrides the content type WordPress reports. Worth setting when WordPress is
   * vague about it — a bare `text/plain` leaves the browser guessing at the encoding.
   */
  contentType?: string;
}

// Deliberately excludes `content-length` and `etag`. `fetch` negotiates gzip with
// WordPress and transparently decompresses the body, but the upstream headers still
// describe the *compressed* representation — forwarding either one makes clients
// truncate the file at the compressed length. Let the runtime size the body itself.
const PASSTHROUGH_HEADERS = ['content-type', 'last-modified'];

export async function serveUpload({ path, contentType }: AliasOptions): Promise<Response> {
  const wpUrl = import.meta.env.WP_URL;
  const upstream = await fetch(`${wpUrl}/wp-content/uploads/${path}`, {
    headers: { Accept: '*/*', 'User-Agent': 'md-media-proxy' },
    // WordPress answers a missing upload with a 302 to an HTML error page. Following
    // it would hand the browser that page under this route's filename, so treat any
    // redirect as a miss — these paths are pinned and should resolve directly.
    redirect: 'manual',
  });

  // Don't dress a WordPress error page up as the file the URL promises.
  if (!upstream.ok) {
    return new Response('Not found', { status: upstream.status === 404 ? 404 : 502 });
  }

  const headers = new Headers();
  for (const h of PASSTHROUGH_HEADERS) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  if (contentType) headers.set('content-type', contentType);
  // Caching an alias for an hour is right in production, but in development it hides
  // edits to these routes behind a stale copy the browser won't re-request.
  headers.set(
    'cache-control',
    import.meta.env.DEV ? 'no-store' : 'public, max-age=3600, s-maxage=86400'
  );

  // Set this ourselves rather than passing it through, so these URLs always render in
  // the browser regardless of how WordPress happens to serve the underlying file.
  headers.set('content-disposition', 'inline');

  return new Response(upstream.body, { status: 200, headers });
}
