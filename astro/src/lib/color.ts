/**
 * Color utilities for accessible issue color handling.
 *
 * Issue colors come from the deterministic palette below and are used as a
 * highlight background behind talk titles on hover. We ensure:
 * 1. The highlight is visibly distinct from the page background (off-white)
 * 2. The text on top of the highlight meets WCAG contrast requirements
 */

// Page background color (--color-off-white in global.css)
const BG_HEX = '#fffaf0';

// Default highlight / accent (--color-highlighter in global.css). Used as the
// ambient gradient's resting color and the talk-title hover fallback.
export const DEFAULT_HIGHLIGHT = '#d9ff02';

/**
 * Convert hex to RGB array [0-255].
 */
export function hexToRgb(hex: string): [number, number, number] {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
}

/**
 * Convert RGB [0-255] to hex.
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');
}

/**
 * Compute relative luminance per WCAG 2.1.
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function getLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Compute contrast ratio between two colors.
 */
function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Convert RGB to HSL. Returns [h: 0-360, s: 0-1, l: 0-1].
 */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}

/**
 * Convert HSL to RGB. Input [h: 0-360, s: 0-1, l: 0-1]. Returns [0-255].
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

/**
 * Find the nearest accessible version of an issue color.
 *
 * "Accessible" means:
 * - Visibly distinct from the page background (contrast ratio >= 1.3 against cream)
 * - Preserves the hue and saturation as much as possible
 *
 * If the color is already accessible, returns it unchanged.
 * If not, darkens the lightness until it meets the threshold.
 */
export function ensureAccessibleHighlight(hex: string): string {
  const minContrastVsBackground = 1.3;

  const ratio = getContrastRatio(hex, BG_HEX);
  if (ratio >= minContrastVsBackground) {
    return hex;
  }

  // Color is too close to background — darken it
  const [r, g, b] = hexToRgb(hex);
  let [h, s, l] = rgbToHsl(r, g, b);

  // Step lightness down until we meet the threshold
  for (let i = 0; i < 50; i++) {
    l -= 0.02;
    if (l < 0.1) l = 0.1;

    // Also bump saturation slightly to keep it vibrant
    s = Math.min(s + 0.01, 1);

    const [nr, ng, nb] = hslToRgb(h, s, l);
    const candidate = rgbToHex(nr, ng, nb);
    const candidateRatio = getContrastRatio(candidate, BG_HEX);

    if (candidateRatio >= minContrastVsBackground) {
      return candidate;
    }
  }

  // Fallback — shouldn't happen, but return a safe default
  return '#666666';
}

// Design system tokens
const DS_BLACK = '#131313';
const DS_WHITE = '#ffffff';

/**
 * Get the best text color for a given background.
 * Returns the design system's black or white, whichever has better contrast.
 * Uses WCAG large text threshold (3:1) since talk titles are 54px+.
 */
export function getContrastText(hex: string): string {
  const blackRatio = getContrastRatio(hex, DS_BLACK);
  const whiteRatio = getContrastRatio(hex, DS_WHITE);
  return blackRatio >= whiteRatio ? DS_BLACK : DS_WHITE;
}

/**
 * Issue color palette (the "muted" set, picked by the client June 2026).
 * Editors don't pick colors; each issue is assigned one deterministically
 * based on its volume and issue number.
 */
export const ISSUE_COLOR_PALETTE = ['#FDB248', '#0F766E', '#FB7185', '#355273', '#9A80B5', '#00ADCC'] as const;

/**
 * Deterministic issue color from (volume, issue). Issues advance one palette
 * step at a time within a volume; each new volume offsets by 2 so vol 2 issue
 * 1 doesn't share a color with vol 1 issue 1. Cycles through every palette
 * entry before repeating.
 */
export function getIssueColor(volumeNumber: number | string | undefined | null, issueNumber: number | string | undefined | null): string {
  const v = Number(volumeNumber);
  const n = Number(issueNumber);
  if (!Number.isFinite(v) || !Number.isFinite(n)) {
    return ISSUE_COLOR_PALETTE[0];
  }
  const idx = (((v - 1) * 2 + (n - 1)) % ISSUE_COLOR_PALETTE.length + ISSUE_COLOR_PALETTE.length) % ISSUE_COLOR_PALETTE.length;
  return ISSUE_COLOR_PALETTE[idx];
}

/**
 * Recursively walks a fetched API response and stamps issue_color on any
 * object that looks like issue ACF data (has volume_number + issue_number).
 * Lets all downstream code keep reading acf.issue_color without each
 * caller having to compute it.
 */
export function injectIssueColors<T>(data: T): T {
  walk(data);
  return data;
}

function walk(node: any): void {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) walk(item);
    return;
  }
  const v = Number(node.volume_number);
  const n = Number(node.issue_number);
  if (Number.isFinite(v) && Number.isFinite(n)) {
    node.issue_color = getIssueColor(v, n);
  }
  for (const key in node) {
    walk(node[key]);
  }
}
