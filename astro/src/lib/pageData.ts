import { fetchCurrentIssue, fetchIssues, fetchTalksByIssue, fetchSiteSettings, fetchTalks } from './wordpress';

// Prepare the supporting data a set of flexible-content blocks needs to render:
// the current issue (for current_issue), all issues with talks (for issue_list),
// expand settings, and the talk→issue map for link rewriting. Shared by the
// static page route and the SSR preview route so they render identically.
export async function preparePageData(blocks: any[]) {
  let currentIssueData: any = null;
  let allIssuesData: any[] = [];
  const issueSettings = { expandable: true };

  if (blocks.some((b) => b.acf_fc_layout === 'current_issue')) {
    currentIssueData = await fetchCurrentIssue();
  }

  if (blocks.some((b) => b.acf_fc_layout === 'issue_list')) {
    const [issues, settings] = await Promise.all([fetchIssues(), fetchSiteSettings()]);
    issueSettings.expandable = settings.issues_expandable_talks;
    allIssuesData = await Promise.all(
      issues.map(async (issue) => {
        const talks = issueSettings.expandable ? await fetchTalksByIssue(issue.id) : [];
        return { ...issue, talks };
      })
    );
    allIssuesData.sort((a, b) => {
      if (b.acf.volume_number !== a.acf.volume_number) return b.acf.volume_number - a.acf.volume_number;
      return b.acf.issue_number - a.acf.issue_number;
    });
  }

  const talkIssueMap = new Map(
    (await fetchTalks()).filter((t) => t.slug && t.issue_slug).map((t) => [t.slug, t.issue_slug!])
  );

  return { currentIssueData, allIssuesData, issueSettings, talkIssueMap };
}
