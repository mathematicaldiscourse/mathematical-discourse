<script lang="ts">
  interface Props {
    label: string;
    feedUrl: string;
    triggerClass?: string;
  }

  let { label, feedUrl, triggerClass = '' }: Props = $props();

  let dialogEl = $state<HTMLDialogElement | null>(null);
  let copied = $state(false);
  let liveMessage = $state('');

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
      await navigator.clipboard.writeText(feedUrl);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = feedUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    copied = true;
    liveMessage = 'RSS feed URL copied to clipboard.';
    setTimeout(() => { copied = false; }, 2000);
  }
</script>

<button
  type="button"
  onclick={open}
  class={triggerClass}
>{label}</button>

<dialog
  bind:this={dialogEl}
  onclick={onDialogClick}
  onclose={onDialogClose}
  aria-labelledby="rss-modal-title"
  class="rss-dialog w-full max-w-2xl bg-off-white border border-black rounded-xl p-0 m-auto text-black"
>
  <header class="flex items-center justify-between border-b border-black px-6 py-4">
    <h2 id="rss-modal-title" class="font-mono text-sm uppercase">RSS Feed</h2>
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
    <p class="font-sans text-base leading-relaxed">
      Subscribe in your favorite feed reader using the URL below.
    </p>

    <div class="border border-black/30 rounded-xl bg-white/60">
      <pre class="font-mono text-sm leading-relaxed p-4 whitespace-pre-wrap break-all">{feedUrl}</pre>
    </div>

    <div class="flex justify-end items-center gap-3">
      <span class="sr-only" aria-live="polite">{liveMessage}</span>
      <a
        href={feedUrl}
        class="inline-flex items-center gap-2 px-6 py-3 border border-black rounded-xl font-mono text-sm uppercase no-underline text-inherit bg-transparent hover:bg-highlighter hover:rounded-[999px]"
        style="transition: background-color 150ms ease-in-out, border-radius 150ms ease-in-out;"
      >Open feed</a>
      <button
        onclick={copy}
        class="inline-flex items-center gap-2 px-6 py-3 border border-black rounded-xl font-mono text-sm uppercase cursor-pointer bg-transparent hover:bg-highlighter hover:rounded-[999px]"
        style="transition: background-color 150ms ease-in-out, border-radius 150ms ease-in-out;"
      >
        <svg class="size-4" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span>{copied ? 'Copied' : 'Copy URL'}</span>
      </button>
    </div>
  </div>
</dialog>

<style>
  .rss-dialog::backdrop {
    background: rgba(255, 250, 240, 0.4);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
  .rss-dialog[open] {
    animation: rss-fade-in 120ms ease-out;
  }
  @keyframes rss-fade-in {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .rss-dialog[open] { animation: none; }
  }
</style>
