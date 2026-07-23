export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function groupByVolume<T extends { acf: { volume_number: number } }>(issues: T[]): [number, T[]][] {
  const map = new Map<number, T[]>();
  for (const issue of issues) {
    const vol = issue.acf.volume_number;
    if (!map.has(vol)) map.set(vol, []);
    map.get(vol)!.push(issue);
  }
  return [...map.entries()].sort((a, b) => b[0] - a[0]);
}

export function timestampToSeconds(timestamp: string): number {
  const parts = timestamp.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] ?? 0;
}

export function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] ?? null;
}

export function formatIssueLabel(volumeNumber: number | null | undefined, issueNumber: number | null | undefined): string {
  const parts: string[] = [];
  if (volumeNumber != null) parts.push(`Vol. ${volumeNumber}`);
  if (issueNumber != null) parts.push(`Issue ${issueNumber}`);
  return parts.join(', ');
}

export function formatVolumeHeading(volumeNumber: number): string {
  return `Volume ${volumeNumber}`;
}

