/**
 * Format a date string (YYYY-MM-DD) to a human-readable format.
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Group issues by volume number, sorted descending.
 * Returns an array of [volumeNumber, issues[]] tuples.
 */
export function groupByVolume<T extends { acf: { volume_number: number } }>(issues: T[]): [number, T[]][] {
  const map = new Map<number, T[]>();
  for (const issue of issues) {
    const vol = issue.acf.volume_number;
    if (!map.has(vol)) map.set(vol, []);
    map.get(vol)!.push(issue);
  }
  return [...map.entries()].sort((a, b) => b[0] - a[0]);
}

/**
 * Convert a timestamp string (HH:MM:SS) to total seconds.
 */
export function timestampToSeconds(timestamp: string): number {
  const parts = timestamp.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] ?? 0;
}

/**
 * Extract YouTube video ID from a URL.
 */
export function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] ?? null;
}

/**
 * Format a volume/issue label.
 * formatIssueLabel(1, 2)        → "Vol. 1, Issue 2"
 * formatIssueLabel(null, 2)     → "Issue 2"
 * formatIssueLabel(1, null)     → "Vol. 1"
 */
export function formatIssueLabel(volumeNumber: number | null | undefined, issueNumber: number | null | undefined): string {
  const parts: string[] = [];
  if (volumeNumber != null) parts.push(`Vol. ${volumeNumber}`);
  if (issueNumber != null) parts.push(`Issue ${issueNumber}`);
  return parts.join(', ');
}

/**
 * Format a volume heading.
 * formatVolumeHeading(1) → "Volume 1"
 */
export function formatVolumeHeading(volumeNumber: number): string {
  return `Volume ${volumeNumber}`;
}

