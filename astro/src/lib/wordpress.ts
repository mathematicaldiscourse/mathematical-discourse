import type {
  Talk,
  TalkSummary,
  Issue,
  CurrentIssueResponse,
  EditorGroup,
  SearchIndexEntry,
  Page,
  TaxonomyTerm,
} from './types';
import { injectIssueColors } from './color';

const WP_URL = import.meta.env.WP_URL;
if (!WP_URL) {
  throw new Error(
    'WP_URL is not set. Builds fetch all content from WordPress — set WP_URL in astro/.env (e.g. http://mathematical-discourse.ddev.site).'
  );
}
const WP_API = `${WP_URL}/wp-json`;

export class WordPressApiError extends Error {
  status: number;
  constructor(status: number, statusText: string, endpoint: string) {
    super(`WordPress API error: ${status} ${statusText} for ${endpoint}`);
    this.status = status;
  }
}

async function fetchAPI<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${WP_API}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new WordPressApiError(res.status, res.statusText, endpoint);
  }
  return injectIssueColors(await res.json());
}

export async function fetchTalks(params?: Record<string, string>): Promise<Talk[]> {
  return fetchAPI<Talk[]>('/wp/v2/talks', { per_page: '100', ...params });
}

export async function fetchTalkBySlug(slug: string): Promise<Talk | null> {
  const talks = await fetchAPI<any[]>('/wp/v2/talks', { slug, _embed: '1' });
  const talk = talks[0] ?? null;
  if (!talk) return null;

  const embeddedTerms = talk._embedded?.['wp:term'] ?? [];
  const allTerms = embeddedTerms.flat();
  talk.subject_areas = allTerms.filter((t: any) => t.taxonomy === 'subject_area');
  talk.talk_formats = allTerms.filter((t: any) => t.taxonomy === 'talk_format');

  return talk as Talk;
}

export async function fetchIssues(): Promise<Issue[]> {
  return fetchAPI<Issue[]>('/wp/v2/issues', { per_page: '100', orderby: 'date', order: 'desc' });
}

export async function fetchIssueBySlug(slug: string): Promise<Issue | null> {
  const issues = await fetchAPI<Issue[]>('/wp/v2/issues', { slug });
  return issues[0] ?? null;
}

export async function fetchCurrentIssue(): Promise<CurrentIssueResponse | null> {
  try {
    return await fetchAPI<CurrentIssueResponse>('/md/v1/current-issue');
  } catch (err) {
    if (err instanceof WordPressApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function fetchTalksByIssue(issueId: number): Promise<TalkSummary[]> {
  return fetchAPI<TalkSummary[]>(`/md/v1/talks-by-issue/${issueId}`);
}

export async function fetchEditors(): Promise<EditorGroup[]> {
  return fetchAPI<EditorGroup[]>('/md/v1/editors');
}

export async function fetchSubjectAreas(): Promise<TaxonomyTerm[]> {
  return fetchAPI<TaxonomyTerm[]>('/wp/v2/subject-areas', { per_page: '100' });
}

export async function fetchTalkFormats(): Promise<TaxonomyTerm[]> {
  return fetchAPI<TaxonomyTerm[]>('/wp/v2/talk-formats', { per_page: '100' });
}

export async function fetchTalksBySubjectArea(termId: number): Promise<Talk[]> {
  return fetchAPI<Talk[]>('/wp/v2/talks', { 'subject-areas': String(termId), per_page: '100' });
}

export async function fetchTalksByFormat(termId: number): Promise<Talk[]> {
  return fetchAPI<Talk[]>('/wp/v2/talks', { 'talk-formats': String(termId), per_page: '100' });
}

export async function fetchSubjectAreaBySlug(slug: string): Promise<TaxonomyTerm | null> {
  const terms = await fetchAPI<TaxonomyTerm[]>('/wp/v2/subject-areas', { slug });
  return terms[0] ?? null;
}

export async function fetchTalkFormatBySlug(slug: string): Promise<TaxonomyTerm | null> {
  const terms = await fetchAPI<TaxonomyTerm[]>('/wp/v2/talk-formats', { slug });
  return terms[0] ?? null;
}

export async function fetchSearchIndex(): Promise<SearchIndexEntry[]> {
  return fetchAPI<SearchIndexEntry[]>('/md/v1/search-index');
}

export async function fetchPageBySlug(slug: string): Promise<Page | null> {
  const pages = await fetchAPI<Page[]>('/wp/v2/pages', { slug });
  return pages[0] ?? null;
}

export async function fetchPages(): Promise<Page[]> {
  return fetchAPI<Page[]>('/wp/v2/pages', { per_page: '100' });
}

export async function fetchPageById(id: number): Promise<Page | null> {
  try {
    return await fetchAPI<Page>(`/wp/v2/pages/${id}`);
  } catch {
    return null;
  }
}

export async function fetchFrontPage(): Promise<Page | null> {
  const settings = await fetchSiteSettings();
  if (settings.front_page_id) {
    const page = await fetchPageById(settings.front_page_id);
    if (page) return page;
  }
  return fetchPageBySlug('home');
}

async function fetchDraft<T>(restPath: string): Promise<T | null> {
  const user = import.meta.env.WP_PREVIEW_USER;
  const pass = import.meta.env.WP_PREVIEW_APP_PASSWORD;
  if (!user || !pass) return null;
  const res = await fetch(`${WP_API}${restPath}?context=edit`, {
    headers: { Authorization: 'Basic ' + btoa(`${user}:${pass}`) },
  });
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

export const fetchDraftPage = (id: number) => fetchDraft<Page>(`/wp/v2/pages/${id}`);
export const fetchDraftTalk = (id: number) => fetchDraft<Talk>(`/wp/v2/talks/${id}`);
export const fetchDraftIssue = (id: number) => fetchDraft<any>(`/wp/v2/issues/${id}`);

export interface FooterFunder {
  name: string;
  url: string;
}

export interface FooterLink {
  label: string;
  link_type: 'url' | 'rss';
  url: string;
}

export interface SiteSettings {
  enable_spot_gradient: boolean;
  issues_expandable_talks: boolean;
  home_tagline: string;
  issues_page_intro: string;
  footer_privacy_url: string;
  footer_org_name: string;
  footer_funders: FooterFunder[];
  footer_links_heading: string;
  footer_links: FooterLink[];
  not_found_text: string;
  not_found_button_label: string;
  not_found_button_url: string;
  front_page_id: number;
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  return fetchAPI<SiteSettings>('/md/v1/site-settings');
}

export interface NavItem {
  id: number;
  title: string;
  url: string;
}

export async function fetchPrimaryNav(): Promise<NavItem[]> {
  return fetchAPI<NavItem[]>('/md/v1/nav/primary');
}

export async function fetchFooterNav(): Promise<NavItem[]> {
  return fetchAPI<NavItem[]>('/md/v1/nav/footer');
}
