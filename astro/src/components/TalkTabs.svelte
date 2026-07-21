<script lang="ts">
  import CiteButtonIsland from './CiteButtonIsland.svelte';

  interface TocEntry {
    subtitle: string;
    timestamp: string;
  }

  interface SubjectArea {
    name: string;
    slug: string;
  }

  interface Synopsis {
    dateFilmed: string;
    location: string;
    locationUrl: string;
    mscCodes: string;
    fundingInformation: string;
    comments: string;
    citation: {
      title: string;
      speakers: string[];
      year: string;
      volume: number | null;
      number: number | null;
      url: string;
    };
    printArticles: { text: string; url: string }[];
    subjectAreas: SubjectArea[];
  }

  let { tocEntries = [], canSeek = true, synopsis, talkNotes = '' }: { tocEntries: TocEntry[]; canSeek?: boolean; synopsis: Synopsis; talkNotes?: string } = $props();

  type TabId = 'synopsis' | 'toc' | 'notes';
  let activeTab = $state<TabId>('synopsis');

  const tabs = $derived([
    { id: 'synopsis' as const, label: 'Talk Data' },
    ...(tocEntries.length > 0 ? [{ id: 'toc' as const, label: 'Table of Contents' }] : []),
    ...(talkNotes ? [{ id: 'notes' as const, label: 'Talk Notes' }] : []),
  ]);

  function handleSeek(timestamp: string) {
    const video = document.querySelector('[data-video-player]');
    if (video) video.scrollIntoView({ behavior: 'smooth', block: 'center' });
    document.dispatchEvent(new CustomEvent('toc-seek', { detail: { timestamp } }));
  }

  function handleTabKeydown(e: KeyboardEvent, tabId: TabId) {
    const currentIndex = tabs.findIndex(t => t.id === tabId);
    let nextIndex = -1;

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = tabs.length - 1;
    }

    if (nextIndex >= 0) {
      activeTab = tabs[nextIndex].id;
      const el = document.getElementById(`talk-tab-${tabs[nextIndex].id}`);
      el?.focus();
    }
  }
</script>

<div class="flex flex-col md:flex-row md:items-start gap-4 md:gap-0">
  <!-- Tab buttons -->
  <div
    role="tablist"
    aria-label="Talk information"
    class="flex flex-col -space-y-px md:w-[316px] md:shrink-0"
  >
    {#each tabs as tab}
      <button
        id="talk-tab-{tab.id}"
        role="tab"
        aria-selected={activeTab === tab.id}
        aria-controls="talk-panel-{tab.id}"
        tabindex={activeTab === tab.id ? 0 : -1}
        onclick={() => activeTab = tab.id}
        onkeydown={(e) => handleTabKeydown(e, tab.id)}
        class="flex-1 md:flex-none px-4 py-6 md:py-10 rounded-[13px] border border-black text-center font-mono text-lg md:text-2xl cursor-pointer transition-colors relative {activeTab === tab.id ? 'bg-black text-off-white z-10' : 'bg-transparent text-black hover:bg-highlighter'}"
      >
        {tab.label}
      </button>
    {/each}
  </div>

  <!-- Content -->
  <div class="flex-1 md:ml-8">
    <div
      id="talk-panel-synopsis"
      role="tabpanel"
      aria-labelledby="talk-tab-synopsis"
      hidden={activeTab !== 'synopsis'}
    >
      <div class="flex flex-col gap-4 max-w-prose">
        {#if synopsis.subjectAreas && synopsis.subjectAreas.length > 0}
          <div class="md:flex md:flex-wrap md:items-center gap-x-3 gap-y-2">
            <p class="font-sans text-lg"><strong>Subject areas:</strong></p>
            <div class="flex flex-wrap gap-2 font-mono uppercase text-xs mt-2 md:mt-0">
              {#each synopsis.subjectAreas as tag}
                <a
                  href="/subject/{tag.slug}"
                  class="inline-block px-4 py-1 border border-black rounded-md no-underline text-inherit hover:bg-highlighter hover:rounded-3xl transition-[background-color,border-radius] duration-150"
                >{tag.name}</a>
              {/each}
            </div>
          </div>
        {/if}
        {#if synopsis.dateFilmed}
          <p class="font-sans text-lg"><strong>Date Filmed:</strong> {synopsis.dateFilmed}</p>
        {/if}
        {#if synopsis.location}
          <p class="font-sans text-lg"><strong>Location Filmed:</strong> {#if synopsis.locationUrl}<a href={synopsis.locationUrl} class="underline hover:bg-highlighter transition-colors">{synopsis.location}</a>{:else}{synopsis.location}{/if}</p>
        {/if}
        {#if synopsis.printArticles.length > 0}
          <p class="font-sans text-lg"><strong>Print articles:</strong> {#each synopsis.printArticles as a, i}<a href={a.url} class="underline hover:bg-highlighter transition-colors">{a.text}</a>{#if i < synopsis.printArticles.length - 1}, {/if}{/each}</p>
        {/if}
        {#if synopsis.mscCodes}
          <p class="font-sans text-lg"><strong>MSC Codes:</strong> {synopsis.mscCodes}</p>
        {/if}
        {#if synopsis.fundingInformation}
          <p class="font-sans text-lg"><strong>Funding information:</strong> {synopsis.fundingInformation}</p>
        {/if}
        {#if synopsis.comments}
          <div class="long-form-text">{@html synopsis.comments}</div>
        {/if}
        <CiteButtonIsland
          title={synopsis.citation.title}
          speakers={synopsis.citation.speakers}
          year={synopsis.citation.year}
          volume={synopsis.citation.volume}
          number={synopsis.citation.number}
          url={synopsis.citation.url}
        />
      </div>
    </div>

    <div
      id="talk-panel-toc"
      role="tabpanel"
      aria-labelledby="talk-tab-toc"
      hidden={activeTab !== 'toc'}
    >
      <div class="flex flex-col">
        {#each tocEntries as entry}
          {#if canSeek}
            <button
              onclick={() => handleSeek(entry.timestamp)}
              class="flex items-start justify-between py-4 border-b border-black text-left cursor-pointer bg-transparent hover:bg-highlighter transition-colors"
              aria-label="Jump to {entry.timestamp}"
            >
              <span class="font-sans text-base md:text-xl pr-8">{@html entry.subtitle}</span>
              <span class="font-mono text-base md:text-lg shrink-0">{entry.timestamp}</span>
            </button>
          {:else}
            <div class="flex items-start justify-between py-4 border-b border-black">
              <span class="font-sans text-base md:text-xl pr-8">{@html entry.subtitle}</span>
              <span class="font-mono text-base md:text-lg shrink-0">{entry.timestamp}</span>
            </div>
          {/if}
        {/each}
      </div>
    </div>

    <div
      id="talk-panel-notes"
      role="tabpanel"
      aria-labelledby="talk-tab-notes"
      hidden={activeTab !== 'notes'}
    >
      <div class="long-form-text max-w-prose">{@html talkNotes}</div>
    </div>
  </div>
</div>
