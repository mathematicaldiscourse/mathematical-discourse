
const WP_HOST = (() => {
  try {
    return new URL(import.meta.env.WP_URL).host;
  } catch {
    return '';
  }
})();

function mapHref(href: string, talkIssueMap: Map<string, string>): string {
  if (/^(#|mailto:|tel:|javascript:)/i.test(href)) return href;

  let url: URL;
  try {
    url = new URL(href, import.meta.env.WP_URL);
  } catch {
    return href;
  }

  if (WP_HOST && url.host !== WP_HOST) return href;

  if (url.pathname.startsWith('/wp-content/uploads/')) return url.pathname + url.search;
  if (/^\/wp-(content|includes|admin)\//.test(url.pathname)) return url.href;

  const segments = url.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  if (segments.length === 0) return '/'; // CMS home → frontend root

  const [base, slug] = segments;
  switch (base) {
    case 'talk': {
      if (!slug) return href;
      const issue = talkIssueMap.get(slug);
      return issue ? `/issue/${issue}/${slug}` : href;
    }
    case 'subject-area':
      return slug ? `/subject/${slug}` : href;
    case 'talk-format':
      return slug ? `/format/${slug}` : href;
    case 'issue':
      return '/' + segments.join('/'); // /issue/<slug>[/<talk>]
    default:
      return segments.length === 1 ? `/${base}` : url.pathname;
  }
}

export function mediaPath(url: string): string {
  if (!url) return url;
  try {
    const u = new URL(url, import.meta.env.WP_URL);
    if (WP_HOST && u.host === WP_HOST && u.pathname.startsWith('/wp-content/uploads/')) {
      return u.pathname + u.search;
    }
  } catch { /* not a URL — leave as-is */ }
  return url;
}

export function rewriteContentLinks(html: string, talkIssueMap: Map<string, string>): string {
  if (!html) return html;
  return html.replace(
    /(<a\b[^>]*?\shref=")([^"]+)(")/gi,
    (_match, pre, href, post) => pre + mapHref(href, talkIssueMap) + post
  );
}
