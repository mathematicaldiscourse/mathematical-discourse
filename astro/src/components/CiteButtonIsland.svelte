<script lang="ts">
  interface Props {
    title: string;
    speakers: string[];
    year: string;
    volume: number | null;
    number: number | null;
    url: string;
  }

  let { title, speakers, year, volume, number, url }: Props = $props();

  let dialogEl = $state<HTMLDialogElement | null>(null);
  let format = $state<'plain' | 'bibtex'>('plain');
  let copied = $state(false);
  let liveMessage = $state('');

  function cleanTitle(): string {
    return (title || '')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#0?39;|&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  function getPlainCitation(): string {
    const authorStr = speakers.join(' and ');
    let s = `${authorStr}. "${cleanTitle()}". In: Mathematical Discourse`;
    if (volume != null && number != null) s += ` ${volume}.${number}`;
    if (year) s += ` (${year})`;
    s += `. URL: ${url}.`;
    return s;
  }

  function getBibtexCitation(): string {
    const firstSpeaker = speakers[0] || '';
    const lastName = firstSpeaker.trim().split(/\s+/).pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'talk';
    const citeKey = `${lastName}${year || ''}`;
    const authorStr = speakers.join(' and ');
    const pad = (k: string) => k.padEnd(9);
    const lines = [
      `@article{${citeKey},`,
      `  ${pad('author')}= {${authorStr}},`,
      `  ${pad('title')}= {{${cleanTitle()}}},`,
      `  ${pad('journal')}= {Mathematical Discourse},`,
    ];
    if (year) lines.push(`  ${pad('year')}= ${year},`);
    if (volume != null) lines.push(`  ${pad('volume')}= {${volume}},`);
    if (number != null) lines.push(`  ${pad('number')}= {${number}},`);
    lines.push(`  ${pad('url')}= {${url}}`);
    lines.push('}');
    return lines.join('\n');
  }

  let currentText = $derived(format === 'plain' ? getPlainCitation() : getBibtexCitation());

  function open() {
    copied = false;
    liveMessage = '';
    dialogEl?.showModal();
    document.body.style.overflow = 'hidden';
  }

  function close() {
    dialogEl?.close();
  }

  function onDialogClose() {
    document.body.style.overflow = '';
  }

  function onDialogClick(e: MouseEvent) {
    if (e.target === dialogEl) close();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(currentText);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = currentText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    copied = true;
    liveMessage = `${format === 'plain' ? 'Plain text' : 'BibTeX'} citation copied to clipboard.`;
    setTimeout(() => { copied = false; }, 2000);
  }

  function setFormat(next: 'plain' | 'bibtex', focusTab = false) {
    format = next;
    copied = false;
    if (focusTab) {
      setTimeout(() => {
        document.getElementById(`cite-tab-${next}`)?.focus();
      }, 0);
    }
  }

  function onTabKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      setFormat(format === 'plain' ? 'bibtex' : 'plain', true);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setFormat('plain', true);
    } else if (e.key === 'End') {
      e.preventDefault();
      setFormat('bibtex', true);
    }
  }
</script>

<button
  onclick={open}
  class="self-start inline-flex items-center gap-2 px-6 py-3 border border-black rounded-xl font-mono text-sm uppercase cursor-pointer bg-transparent hover:bg-highlighter hover:rounded-[999px]"
  style="transition: background-color 150ms ease-in-out, border-radius 150ms ease-in-out;"
>
  <svg class="size-4" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
  <span>Cite this talk</span>
</button>

<dialog
  bind:this={dialogEl}
  onclick={onDialogClick}
  onclose={onDialogClose}
  aria-labelledby="cite-modal-title"
  class="cite-dialog w-full max-w-2xl bg-off-white border border-black rounded-xl p-0 m-auto text-black"
>
  <header class="flex items-center justify-between border-b border-black px-6 py-4">
    <h2 id="cite-modal-title" class="font-mono text-sm uppercase">Cite this talk</h2>
    <button
      onclick={close}
      class="-mr-2 p-2 cursor-pointer hover:bg-highlighter rounded-md"
      aria-label="Close"
    >
      <svg class="size-5" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  </header>

  <div class="px-6 py-6 flex flex-col gap-5">
    <div role="tablist" aria-label="Citation format" class="inline-flex border border-black rounded-xl overflow-hidden self-start">
      <button
        id="cite-tab-plain"
        role="tab"
        aria-selected={format === 'plain'}
        aria-controls="cite-panel"
        tabindex={format === 'plain' ? 0 : -1}
        onclick={() => setFormat('plain')}
        onkeydown={onTabKeydown}
        class="px-4 py-2 font-mono text-sm uppercase cursor-pointer transition-colors"
        class:bg-highlighter={format === 'plain'}
        class:bg-transparent={format !== 'plain'}
        class:hover:bg-highlighter={format !== 'plain'}
      >
        Plain text
      </button>
      <button
        id="cite-tab-bibtex"
        role="tab"
        aria-selected={format === 'bibtex'}
        aria-controls="cite-panel"
        tabindex={format === 'bibtex' ? 0 : -1}
        onclick={() => setFormat('bibtex')}
        onkeydown={onTabKeydown}
        class="px-4 py-2 font-mono text-sm uppercase cursor-pointer border-l border-black transition-colors"
        class:bg-highlighter={format === 'bibtex'}
        class:bg-transparent={format !== 'bibtex'}
        class:hover:bg-highlighter={format !== 'bibtex'}
      >
        BibTeX
      </button>
    </div>

    <div
      id="cite-panel"
      role="tabpanel"
      aria-labelledby={format === 'plain' ? 'cite-tab-plain' : 'cite-tab-bibtex'}
      tabindex="0"
      class="border border-black/30 rounded-xl bg-white/60 h-72 overflow-auto"
    >
      <pre class="font-mono text-sm leading-relaxed p-4 whitespace-pre-wrap break-words">{currentText}</pre>
    </div>

    <div class="flex justify-end items-center gap-3">
      <span class="sr-only" aria-live="polite">{liveMessage}</span>
      <button
        onclick={copy}
        class="inline-flex items-center gap-2 px-6 py-3 border border-black rounded-xl font-mono text-sm uppercase cursor-pointer bg-transparent hover:bg-highlighter hover:rounded-[999px]"
        style="transition: background-color 150ms ease-in-out, border-radius 150ms ease-in-out;"
      >
        <svg class="size-4" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span>{copied ? 'Copied' : 'Copy'}</span>
      </button>
    </div>
  </div>
</dialog>

<style>
  .cite-dialog::backdrop {
    background: rgba(255, 250, 240, 0.4);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
  .cite-dialog[open] {
    animation: cite-fade-in 120ms ease-out;
  }
  @keyframes cite-fade-in {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .cite-dialog[open] { animation: none; }
  }
</style>
