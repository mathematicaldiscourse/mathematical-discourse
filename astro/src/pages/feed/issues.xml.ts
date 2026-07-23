import type { APIRoute } from 'astro';
import { fetchIssues, fetchTalksByIssue } from '../../lib/wordpress';
import { formatIssueLabel } from '../../lib/utils';

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.toString().replace(/\/$/, '') || 'https://mathematicaldiscourse.org';
  const issues = await fetchIssues();

  const items: string[] = [];

  for (const issue of issues) {
    const talks = await fetchTalksByIssue(issue.id);
    const acf = issue.acf;
    const pubDate = acf.publication_date
      ? new Date(acf.publication_date).toUTCString()
      : new Date().toUTCString();

    const itemTitle = formatIssueLabel(acf.volume_number, acf.issue_number);

    let description = '';
    if (acf.issue_summary) {
      description += `<p>${escapeXml(acf.issue_summary)}</p>`;
    }
    if (talks.length > 0) {
      description += '<ul>';
      for (const talk of talks) {
        const speakers = talk.acf.speakers?.map((s) => s.name).join(', ');
        description += `<li><a href="${siteUrl}/issue/${issue.slug}/${talk.slug}">${escapeXml(talk.title)}</a>${speakers ? ', ' + escapeXml(speakers) : ''}</li>`;
      }
      description += '</ul>';
    }

    items.push(`    <item>
      <title>${escapeXml(itemTitle)}</title>
      <link>${siteUrl}/issue/${issue.slug}</link>
      <guid isPermaLink="false">${issue.id}@${siteUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${description}]]></description>
    </item>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet href="/feed-style.xsl" type="text/xsl"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Mathematical Discourse — Issues</title>
  <link>${siteUrl}</link>
  <description>New issues from Mathematical Discourse</description>
  <language>en</language>
  <atom:link href="${siteUrl}/feed/issues.xml" rel="self" type="application/rss+xml" />
${items.join('\n')}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
