import katex from 'katex';

export function renderLatex(input: string): string {
  if (!input) return '';

  let result = input.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false });
    } catch {
      return tex;
    }
  });

  result = result.replace(/\$([^\$]+?)\$/g, (_, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return tex;
    }
  });

  return result;
}
