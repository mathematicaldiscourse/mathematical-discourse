export interface Speaker {
  name: string;
  affiliation: string;
}

export interface TocEntry {
  subtitle: string;
  timestamp: string;
}

export interface VideoLink {
  url: string;
}

export interface TaxonomyTerm {
  id?: number;
  term_id?: number;
  name: string;
  slug: string;
  description?: string;
  count?: number;
}

export interface TalkAcf {
  talk_title_latex: string;
  speakers: Speaker[];
  talk_date: string;
  host_institution: string;
  host_series: string;
  copyright_holder_link: string;
  video_links: VideoLink[];
  video_duration: string;
  toc_entries: TocEntry[] | false;
  comments: string;
  abstract: string;
  preprint_link: string;
  related_issue: any;
  keywords: string;
  msc_codes: string;
  funding_information: string;
}

/** Talk as returned by the standard WP REST API (/wp/v2/talks). */
export interface Talk {
  id: number;
  slug: string;
  title: { rendered: string };
  acf: TalkAcf;
  issue_slug?: string;
  subject_areas?: TaxonomyTerm[];
  talk_formats?: TaxonomyTerm[];
}

/**
 * Talk as returned by the custom md/v1 endpoints (current-issue,
 * talks-by-issue). Same shape except `title` is a plain string —
 * get_the_title(), not the wp/v2 { rendered } wrapper.
 */
export interface TalkSummary extends Omit<Talk, 'title'> {
  title: string;
}

export interface IssueAcf {
  issue_number: number;
  volume_number: number;
  publication_date: string;
  issue_color: string;
  issue_summary: string;
  is_current_issue: boolean;
}

/**
 * Issue as returned by /wp/v2/issues. NOTE: the issue CPT registers with
 * supports: ['revisions'] only, so wp/v2 responses have NO title field —
 * the admin-facing title is auto-generated from volume/issue numbers.
 * Display labels come from formatIssueLabel(volume, issue) instead.
 */
export interface Issue {
  id: number;
  slug: string;
  acf: IssueAcf;
}

/** md/v1/current-issue — title here IS present (get_the_title, plain string). */
export interface CurrentIssueResponse extends Issue {
  title: string;
  talks: TalkSummary[];
}

export interface PersonAcf {
  person_title_role: string;
  institution: string;
  subject_areas: TaxonomyTerm[];
  dates_affiliated: { start_date: string; end_date: string }[];
  related_links: { label: string; url: string }[] | false;
}

export interface Person {
  id: number;
  slug: string;
  title: { rendered: string };
  acf: PersonAcf;
}

export interface EditorGroup {
  role: string;
  members: {
    id: number;
    name: string;
    role: string;
    institution: string;
    acf: PersonAcf;
  }[];
}

/** One entry of /md/v1/search-index — keep in sync with rest-api.php. */
export interface SearchIndexEntry {
  id: number;
  slug: string;
  title: string;
  title_plain: string;
  speakers: string[];
  summary: string;
  summary_plain: string;
  abstract_plain: string;
  subject_areas: string[];
  talk_format: string[];
  issue_number: number | null;
  volume_number: number | null;
  issue_title: string | null;
  issue_slug: string | null;
  keywords: string;
  date: string;
  host_institution?: string;
  video_duration?: string;
}

export interface FlexibleContentBlock {
  acf_fc_layout: string;
  [key: string]: any;
}

export interface Page {
  id: number;
  slug: string;
  title: { rendered: string };
  acf: {
    hero_title?: string;
    content_blocks: FlexibleContentBlock[] | false;
  };
}
