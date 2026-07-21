// Rewrite author-inserted links in WYSIWYG content from WordPress permalinks
// to the corresponding frontend routes. WordPress stores links to talks, pages,
// and taxonomy terms as CMS permalinks (e.g. https://<cms>/talk/<slug>/), which
// don't exist on the headless frontend. We map them at build time so in-body
// links actually work. External links, mailto/tel, and anchors are left alone.

const WP_HOST = (() => {
  try {
    return new URL(import.meta.env.WP_URL).host;
  } catch {
    return '';
  }
})();

/**
 * Map a single href from a WordPress permalink to the frontend route.
 * @param talkIssueMap slug → issue-slug, so /talk/<slug>/ can resolve to /issue/<issue>/<slug>
 */
function mapHref(href: string, talkIssueMap: Map<string, string>): string {
  if (/^(#|mailto:|tel:|javascript:)/i.test(href)) return href;

  let url: URL;
  try {
    url = new URL(href, import.meta.env.WP_URL);
  } catch {
    return href;
  }

  // Only touch links pointing at the WordPress host; leave external links be.
  if (WP_HOST && url.host !== WP_HOST) return href;

  // WordPress-served files (uploaded media, theme/plugin assets) live on the CMS
  // host, not the headless frontend. Keep them as absolute CMS URLs so they
  // resolve — otherwise they become frontend-relative and 403/404.
  if (/^\/wp-(content|includes|admin)\//.test(url.pathname)) return url.href;

  const segments = url.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  if (segments.length === 0) return '/'; // CMS home → frontend root

  const [base, slug] = segments;
  switch (base) {
    case 'talk': {
      if (!slug) return href;
      const issue = talkIssueMap.get(slug);
      // A talk with no issue has no frontend page; leave the link unchanged.
      return issue ? `/issue/${issue}/${slug}` : href;
    }
    case 'subject-area':
      return slug ? `/subject/${slug}` : href;
    case 'talk-format':
      return slug ? `/format/${slug}` : href;
    case 'issue':
      return '/' + segments.join('/'); // /issue/<slug>[/<talk>]
    default:
      // Single-segment path is a page (e.g. /about/ → /about).
      return segments.length === 1 ? `/${base}` : url.pathname;
  }
}

/** Rewrite every <a href> in a block of WYSIWYG HTML. */
export function rewriteContentLinks(html: string, talkIssueMap: Map<string, string>): string {
  if (!html) return html;
  return html.replace(
    /(<a\b[^>]*?\shref=")([^"]+)(")/gi,
    (_match, pre, href, post) => pre + mapHref(href, talkIssueMap) + post
  );
}
