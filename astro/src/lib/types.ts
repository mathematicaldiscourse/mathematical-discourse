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

export interface Talk {
  id: number;
  slug: string;
  title: { rendered: string };
  acf: TalkAcf;
  issue_slug?: string;
  subject_areas?: TaxonomyTerm[];
  talk_formats?: TaxonomyTerm[];
}

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

export interface Issue {
  id: number;
  slug: string;
  acf: IssueAcf;
}

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
