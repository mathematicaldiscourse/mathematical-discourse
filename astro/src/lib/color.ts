
const BG_HEX = '#fffaf0';

export const DEFAULT_HIGHLIGHT = '#d9ff02';

export function hexToRgb(hex: string): [number, number, number] {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');
}

function getLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

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

export function ensureAccessibleHighlight(hex: string): string {
  const minContrastVsBackground = 1.3;

  const ratio = getContrastRatio(hex, BG_HEX);
  if (ratio >= minContrastVsBackground) {
    return hex;
  }

  const [r, g, b] = hexToRgb(hex);
  let [h, s, l] = rgbToHsl(r, g, b);

  for (let i = 0; i < 50; i++) {
    l -= 0.02;
    if (l < 0.1) l = 0.1;

    s = Math.min(s + 0.01, 1);

    const [nr, ng, nb] = hslToRgb(h, s, l);
    const candidate = rgbToHex(nr, ng, nb);
    const candidateRatio = getContrastRatio(candidate, BG_HEX);

    if (candidateRatio >= minContrastVsBackground) {
      return candidate;
    }
  }

  return '#666666';
}

const DS_BLACK = '#131313';
const DS_WHITE = '#ffffff';

export function getContrastText(hex: string): string {
  const blackRatio = getContrastRatio(hex, DS_BLACK);
  const whiteRatio = getContrastRatio(hex, DS_WHITE);
  return blackRatio >= whiteRatio ? DS_BLACK : DS_WHITE;
}

export const ISSUE_COLOR_PALETTE = ['#FDB248', '#0F766E', '#FB7185', '#355273', '#9A80B5', '#00ADCC'] as const;

export function getIssueColor(volumeNumber: number | string | undefined | null, issueNumber: number | string | undefined | null): string {
  const v = Number(volumeNumber);
  const n = Number(issueNumber);
  if (!Number.isFinite(v) || !Number.isFinite(n)) {
    return ISSUE_COLOR_PALETTE[0];
  }
  const idx = (((v - 1) * 2 + (n - 1)) % ISSUE_COLOR_PALETTE.length + ISSUE_COLOR_PALETTE.length) % ISSUE_COLOR_PALETTE.length;
  return ISSUE_COLOR_PALETTE[idx];
}

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
