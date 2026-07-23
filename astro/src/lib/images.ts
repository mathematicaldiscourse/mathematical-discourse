export function optimizeImages(html: string): string {
  const isVercel = !!import.meta.env.VERCEL;
  const widths = [640, 828, 1200];

  return html.replace(
    /<img([^>]*?)src="([^"]+)"([^>]*?)>/g,
    (match, before, src, after) => {
      if (src.startsWith('data:') || src.endsWith('.svg')) return match;

      if (isVercel) {
        const srcset = widths
          .map(w => `/_vercel/image?url=${encodeURIComponent(src)}&w=${w}&q=80 ${w}w`)
          .join(', ');
        const defaultSrc = `/_vercel/image?url=${encodeURIComponent(src)}&w=828&q=80`;
        return `<img${before}src="${defaultSrc}" srcset="${srcset}" sizes="(max-width: 710px) 100vw, 710px"${after} loading="lazy">`;
      }

      if (!match.includes('loading=')) {
        return `<img${before}src="${src}"${after} loading="lazy">`;
      }
      return match;
    }
  );
}
