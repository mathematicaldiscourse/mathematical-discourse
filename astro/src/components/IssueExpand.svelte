<script lang="ts">
  import { onMount } from 'svelte';

  let { talkCount = 0, targetId = '' }: {
    talkCount?: number;
    targetId?: string;
  } = $props();

  let open = $state(false);
  const eventName = `md-issue-toggle:${targetId}`;

  onMount(() => {
    const el = document.getElementById(targetId);
    if (el) open = !el.hidden;

    const handler = (e: Event) => {
      open = (e as CustomEvent<{ open: boolean }>).detail.open;
    };
    window.addEventListener(eventName, handler);
    return () => window.removeEventListener(eventName, handler);
  });

  function toggle() {
    const el = document.getElementById(targetId);
    if (!el) return;
    const next = el.hidden;
    el.hidden = !next;
    window.dispatchEvent(new CustomEvent(eventName, { detail: { open: next } }));
    window.dispatchEvent(new CustomEvent('md-issue-toggle', { detail: { open: next, targetId } }));
  }
</script>

<button
  onclick={toggle}
  aria-expanded={open}
  aria-controls={targetId}
  class="inline-flex items-center gap-2 px-4 py-1.5 font-mono text-xs uppercase cursor-pointer bg-transparent hover:bg-highlighter border border-black rounded-full transition-colors duration-150"
>
  {open ? 'Hide' : 'Show'} {talkCount} {talkCount === 1 ? 'talk' : 'talks'}
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 12h14"/>
    {#if !open}<path d="M12 5v14"/>{/if}
  </svg>
</button>
