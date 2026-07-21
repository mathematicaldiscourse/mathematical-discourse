<script lang="ts">
  interface NavItem {
    id: number;
    title: string;
    url: string;
  }

  let { navItems = [] }: { navItems: NavItem[] } = $props();

  let menuOpen = $state(false);

  function toggleMenu() {
    menuOpen = !menuOpen;
  }
</script>

<div class="md:hidden">
  <header class="flex items-center justify-between h-[50px] border-b border-black px-4" data-menu-open={menuOpen ? '' : undefined}>
    <a href="/" aria-label="Mathematical Discourse — home" class="flex items-center justify-center bg-black text-off-white no-underline px-3 self-stretch font-serif text-sm">MD</a>
    <div class="flex items-center self-stretch gap-1">
      <a href="/search" class="flex items-center self-stretch px-2 no-underline hover:bg-highlighter hover:shadow-[inset_0_-0.5px_0_var(--color-black)] transition-colors" aria-label="Search">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      </a>
      <button
        onclick={toggleMenu}
        class="flex items-center self-stretch px-2 bg-transparent border-none cursor-pointer hover:bg-highlighter hover:shadow-[inset_0_-0.5px_0_var(--color-black)] transition-colors"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
      >
        {#if menuOpen}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        {:else}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>
        {/if}
      </button>
    </div>
  </header>

  <div
    class="fixed inset-0 top-[50px] z-50 backdrop-blur-xl bg-off-white/70 transition-all duration-300"
    class:opacity-100={menuOpen}
    class:opacity-0={!menuOpen}
    class:pointer-events-none={!menuOpen}
    class:pointer-events-auto={menuOpen}
  >
    <div
      class="flex flex-col -space-y-px p-6 pt-8 transition-transform duration-300"
      class:translate-y-0={menuOpen}
      class:-translate-y-4={!menuOpen}
    >
      {#each navItems as item}
        <a
          href={item.url}
          class="no-underline flex items-center justify-center font-mono text-4xl py-8 border border-black rounded-lg text-center transition-colors hover:bg-highlighter bg-off-white/90"
          onclick={() => menuOpen = false}
        >{item.title}</a>
      {/each}
    </div>
  </div>
</div>
