/**
 * Process WYSIWYG HTML to add responsive image optimization.
 * On Vercel, rewrites img src through /_vercel/image for WebP/AVIF and resizing.
 * Locally, passes images through as-is.
 */
export function optimizeImages(html: string): string {
  const isVercel = !!import.meta.env.VERCEL;
  // Widths MUST be members of Vercel's configured image sizes, or the optimizer
  // returns 400. Vercel's device sizes include 640/828/1200; 400 and 800 do not.
  const widths = [640, 828, 1200];

  return html.replace(
    /<img([^>]*?)src="([^"]+)"([^>]*?)>/g,
    (match, before, src, after) => {
      // Skip data URIs and SVGs
      if (src.startsWith('data:') || src.endsWith('.svg')) return match;

      if (isVercel) {
        const srcset = widths
          .map(w => `/_vercel/image?url=${encodeURIComponent(src)}&w=${w}&q=80 ${w}w`)
          .join(', ');
        const defaultSrc = `/_vercel/image?url=${encodeURIComponent(src)}&w=828&q=80`;
        return `<img${before}src="${defaultSrc}" srcset="${srcset}" sizes="(max-width: 710px) 100vw, 710px"${after} loading="lazy">`;
      }

      // Local dev: just add lazy loading
      if (!match.includes('loading=')) {
        return `<img${before}src="${src}"${after} loading="lazy">`;
      }
      return match;
    }
  );
}
