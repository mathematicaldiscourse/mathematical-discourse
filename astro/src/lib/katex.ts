import katex from 'katex';

/**
 * Renders LaTeX delimiters in a string to HTML.
 * Supports:
 *   $...$     → inline math
 *   $$...$$   → display math
 * Non-math text passes through unchanged.
 */
export function renderLatex(input: string): string {
  if (!input) return '';

  // First pass: display math ($$...$$)
  let result = input.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false });
    } catch {
      return tex;
    }
  });

  // Second pass: inline math ($...$)
  result = result.replace(/\$([^\$]+?)\$/g, (_, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return tex;
    }
  });

  return result;
}
