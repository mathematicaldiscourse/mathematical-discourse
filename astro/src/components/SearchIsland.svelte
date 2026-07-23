<script lang="ts">
  import Fuse from 'fuse.js';
  import { onMount } from 'svelte';
  import SearchSelect from './SearchSelect.svelte';
  import SearchMultiSelect from './SearchMultiSelect.svelte';
  import { getIssueColor, ensureAccessibleHighlight, getContrastText } from '../lib/color';
  import { renderLatex } from '../lib/katex';
  import { formatDate } from '../lib/utils';
  import type { SearchIndexEntry } from '../lib/types';

  let { entries = [] }: { entries?: SearchIndexEntry[] } = $props();

  type SearchEntry = SearchIndexEntry;

  function buildTalkMeta(talk: SearchEntry): string {
    if (!talk.video_duration) return '';
    const parts: string[] = [talk.video_duration];
    let filmed = '';
    if (talk.date) filmed = `Filmed on ${formatDate(talk.date)}`;
    if (talk.host_institution) filmed += filmed ? ` at ${talk.host_institution}` : `Filmed at ${talk.host_institution}`;
    if (filmed) parts.push(filmed);
    return parts.join(' • ');
  }

  let fuse = $derived(
    new Fuse(entries, {
      keys: [
        { name: 'title_plain', weight: 2 },
        { name: 'speakers', weight: 1.5 },
        { name: 'summary_plain', weight: 1 },
        { name: 'abstract_plain', weight: 0.8 },
        { name: 'keywords', weight: 1.2 },
      ],
      threshold: 0.4,
      ignoreLocation: true,
      includeScore: true,
      includeMatches: true,
    })
  );
  let query = $state('');
  let selectedSubjects = $state<string[]>([]);
  let selectedFormats = $state<string[]>([]);
  let selectedIssues = $state<string[]>([]);
  let selectedYears = $state<string[]>([]);
  let sortBy = $state<'date-desc' | 'date-asc' | 'relevance'>('relevance');
  let filtersOpen = $state(false);

  let allSubjects = $derived([...new Set(entries.flatMap((e) => e.subject_areas))].sort());
  const FORMAT_ORDER = ['Board', 'Slides', 'Seminar', 'Colloquium'];
  let allFormats = $derived(
    [...new Set(entries.flatMap((e) => e.talk_format))].sort((a, b) => {
      const ia = FORMAT_ORDER.indexOf(a);
      const ib = FORMAT_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    })
  );
  let allIssues = $derived.by(() => {
    const issueMap = new Map<string, string>();
    for (const e of entries) {
      if (e.issue_slug && !issueMap.has(e.issue_slug)) {
        const parts: string[] = [];
        if (e.volume_number != null) parts.push(`Vol. ${e.volume_number}`);
        if (e.issue_number != null) parts.push(`Issue ${e.issue_number}`);
        issueMap.set(e.issue_slug, parts.join(', '));
      }
    }
    return [...issueMap.entries()].map(([slug, label]) => ({ slug, label }));
  });
  let allYears = $derived([...new Set(entries.filter((e) => e.date).map((e) => e.date.slice(0, 4)))].sort().reverse());

  let hasActiveFilters = $derived(
    selectedSubjects.length > 0 || selectedFormats.length > 0 || selectedIssues.length > 0 || selectedYears.length > 0 || sortBy !== 'relevance' || query !== ''
  );

  interface ResultEntry extends SearchEntry {
    snippet?: string;
  }

  function buildSnippet(text: string, q: string): string | undefined {
    if (!text) return undefined;
    const clean = text.replace(/<[^>]+>/g, '');
    const lower = clean.toLowerCase();
    const words = q.trim().toLowerCase().split(/\s+/).filter(w => w.length > 1);

    let earliest = -1;
    for (const word of words) {
      const idx = lower.indexOf(word);
      if (idx !== -1 && (earliest === -1 || idx < earliest)) earliest = idx;
    }
    if (earliest === -1) return undefined;

    const windowStart = Math.max(0, earliest - 60);
    const windowEnd = Math.min(clean.length, earliest + 120);
    let snippet = clean.slice(windowStart, windowEnd);
    if (windowStart > 0) snippet = '\u2026' + snippet;
    if (windowEnd < clean.length) snippet = snippet + '\u2026';

    for (const word of words) {
      const re = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      snippet = snippet.replace(re, '<strong>$1</strong>');
    }
    return snippet;
  }

  function substringMatch(entry: SearchEntry, q: string): boolean {
    const lower = q.trim().toLowerCase();
    const words = lower.split(/\s+/).filter(w => w.length > 1);
    const fields = [
      entry.title_plain || '',
      entry.speakers.join(' '),
      entry.summary_plain || '',
      entry.abstract_plain || '',
      entry.keywords || '',
    ].join(' ').toLowerCase();
    return words.some(w => fields.includes(w));
  }

  let results = $derived.by((): ResultEntry[] => {
    if (!entries.length) return [];

    let filtered = entries.map((e): ResultEntry => ({ ...e }));

    if (selectedSubjects.length > 0) {
      filtered = filtered.filter((e) => selectedSubjects.some(s => e.subject_areas.includes(s)));
    }
    if (selectedFormats.length > 0) {
      filtered = filtered.filter((e) => selectedFormats.some(f => e.talk_format.includes(f)));
    }
    if (selectedIssues.length > 0) {
      filtered = filtered.filter((e) => e.issue_slug != null && selectedIssues.includes(e.issue_slug));
    }
    if (selectedYears.length > 0) {
      filtered = filtered.filter((e) => selectedYears.some(y => e.date.startsWith(y)));
    }

    if (query.trim() && fuse) {
      const q = query.trim();

      const searchResults = fuse.search(q);
      const fuseIds = new Set(searchResults.map((r) => r.item.id));

      for (const entry of filtered) {
        if (!fuseIds.has(entry.id) && substringMatch(entry, q)) {
          fuseIds.add(entry.id);
        }
      }

      filtered = filtered.filter((e) => fuseIds.has(e.id));

      filtered = filtered.map((entry) => {
        for (const field of ['summary_plain', 'abstract_plain'] as const) {
          const snippet = buildSnippet(entry[field] as string, q);
          if (snippet) return { ...entry, snippet };
        }
        return entry;
      });

      if (sortBy === 'relevance') {
        const idOrder = new Map(searchResults.map((r, i) => [r.item.id, i]));
        filtered.sort((a, b) => (idOrder.get(a.id) ?? 99999) - (idOrder.get(b.id) ?? 99999));
        return filtered;
      }
    }

    if (sortBy === 'date-desc') {
      filtered.sort((a, b) => b.date.localeCompare(a.date));
    } else if (sortBy === 'date-asc') {
      filtered.sort((a, b) => a.date.localeCompare(b.date));
    }

    return filtered;
  });

  function clearFilters() {
    query = '';
    selectedSubjects = [];
    selectedFormats = [];
    selectedIssues = [];
    selectedYears = [];
    sortBy = 'relevance';
    syncUrl();
  }

  function syncUrl() {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (selectedSubjects.length) params.set('subject', selectedSubjects.join(','));
    if (selectedFormats.length) params.set('format', selectedFormats.join(','));
    if (selectedIssues.length) params.set('issue', selectedIssues.join(','));
    if (selectedYears.length) params.set('year', selectedYears.join(','));
    if (sortBy !== 'relevance') params.set('sort', sortBy);
    const qs = params.toString();
    window.history.replaceState({}, '', qs ? `?${qs}` : window.location.pathname);
  }

  function loadFromUrl() {
    const params = new URLSearchParams(window.location.search);
    query = params.get('q') || '';
    selectedSubjects = params.get('subject')?.split(',').filter(Boolean) || [];
    selectedFormats = params.get('format')?.split(',').filter(Boolean) || [];
    selectedIssues = params.get('issue')?.split(',').filter(Boolean) || [];
    selectedYears = params.get('year')?.split(',').filter(Boolean) || [];
    const sort = params.get('sort');
    if (sort === 'date-desc' || sort === 'date-asc') sortBy = sort;
  }

  onMount(() => {
    loadFromUrl();
  });
</script>

<div class="flex flex-col gap-10 pt-10 pb-20">
    <div class="flex items-center gap-4 border-b-2 border-black pb-3">
      <svg class="size-6 shrink-0 text-black" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <input
        type="search"
        bind:value={query}
        oninput={() => syncUrl()}
        placeholder="What are you looking for?"
        class="w-full font-sans text-xl md:text-2xl bg-transparent border-none outline-none placeholder:text-[#636363] [&::-webkit-search-cancel-button]:hidden"
        aria-label="Search talks"
      />
    </div>

    <button
      onclick={() => filtersOpen = !filtersOpen}
      class="lg:hidden inline-flex items-center gap-2 font-mono text-sm font-medium uppercase border border-black rounded-[9px] px-4 py-2 cursor-pointer bg-transparent transition-[background-color,border-radius] duration-150 ease-in-out hover:bg-highlighter hover:rounded-[999px]"
      aria-expanded={filtersOpen}
      aria-controls="search-filters"
    >
      Filters
      <svg class="size-3 transition-transform duration-150 {filtersOpen ? 'rotate-180' : ''}" aria-hidden="true" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 1L5 5L9 1" />
      </svg>
    </button>

    <div
      id="search-filters"
      class="flex-col gap-6 {filtersOpen ? 'flex' : 'hidden lg:flex'}"
    >
      <div class="flex flex-col lg:flex-row lg:flex-wrap lg:items-center gap-6 lg:gap-8">
        <SearchMultiSelect
          label="Subject Area"
          options={allSubjects.map(s => ({ value: s, label: s }))}
          bind:values={selectedSubjects}
          onchange={syncUrl}
        />
        <SearchMultiSelect
          label="Format"
          options={allFormats.map(f => ({ value: f, label: f }))}
          bind:values={selectedFormats}
          onchange={syncUrl}
        />
        <SearchMultiSelect
          label="Issue"
          options={allIssues.map(i => ({ value: i.slug, label: i.label }))}
          bind:values={selectedIssues}
          onchange={syncUrl}
        />
        <SearchMultiSelect
          label="Year"
          options={allYears.map(y => ({ value: y, label: y }))}
          bind:values={selectedYears}
          onchange={syncUrl}
        />
        <SearchSelect
          label="Sort by"
          options={[{ value: 'relevance', label: 'Relevance' }, { value: 'date-desc', label: 'Newest first' }, { value: 'date-asc', label: 'Oldest first' }]}
          bind:value={sortBy}
          onchange={syncUrl}
        />
      </div>
      <button
        onclick={clearFilters}
        disabled={!hasActiveFilters}
        class="self-start inline-flex items-center font-mono text-xs uppercase border border-black rounded-full px-3 py-1.5 cursor-pointer bg-transparent transition-colors duration-150 hover:bg-black hover:text-off-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-inherit"
      >
        Clear Filters
      </button>
    </div>

    <div class="flex flex-col gap-12 md:gap-16">
      {#each results as talk}
        {@const talkHref = `/issue/${talk.issue_slug || 'unknown'}/${talk.slug}`}
        {@const v = talk.volume_number ?? undefined}
        {@const n = talk.issue_number ?? undefined}
        {@const issueColor = getIssueColor(v, n)}
        {@const highlight = ensureAccessibleHighlight(issueColor)}
        <article class="flex flex-col gap-3.5">
          <div class="flex flex-col gap-3.5 flex-1 min-w-0">
            {#if talk.subject_areas.length > 0}
              <div class="flex flex-wrap gap-2 font-mono uppercase text-xs">
                {#each talk.subject_areas as area}
                  <a
                    href={`/subject/${area.toLowerCase().replace(/\s+/g, '-')}`}
                    class="inline-block px-4 py-1 border border-black rounded-md no-underline text-inherit transition-[background-color,border-radius] duration-150 hover:bg-highlighter hover:rounded-3xl"
                  >{area}</a>
                {/each}
              </div>
            {/if}

            <div>
              <a
                href={talkHref}
                class="talk-item__link font-sans text-xl md:text-2xl lg:text-3xl xl:text-4xl leading-[1.12] no-underline text-inherit relative z-[1]"
                data-issue-color={issueColor}
                style="--highlight-color: {highlight}; --highlight-text: {getContrastText(highlight)};"
              >{@html renderLatex(talk.title)}</a>
            </div>

            <p class="font-serif text-lg">{talk.speakers.join(', ')}</p>

            {#if buildTalkMeta(talk)}
              <p class="font-mono uppercase text-xs md:text-sm tracking-wider">
                <span class="font-sans" aria-hidden="true">▶</span> {buildTalkMeta(talk)}
              </p>
            {/if}

            {#if talk.snippet}
              <p class="font-sans text-sm leading-relaxed max-w-[710px]">{@html talk.snippet}</p>
            {/if}
          </div>
        </article>
      {/each}

      {#if results.length === 0}
        <p class="font-mono text-lg">No talks found.</p>
      {/if}
    </div>
</div>
