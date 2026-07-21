<script lang="ts">
  import { onMount } from 'svelte';

  interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  let rects = $state<Rect[]>([]);
  let visible = $state(false);

  onMount(() => {
    let currentTarget: HTMLElement | null = null;
    let hideTimeout: ReturnType<typeof setTimeout> | null = null;
    let pendingRaf: number | null = null;
    let hasPosition = false;

    function getRects(el: HTMLElement): Rect[] {
      const clientRects = el.getClientRects();
      return Array.from(clientRects).map((r) => ({
        x: r.left - 6,
        y: r.top - 1,
        width: r.width + 12,
        height: r.height + 2,
      }));
    }

    function handleMouseOver(e: MouseEvent) {
      const target = (e.target as HTMLElement)?.closest('.talk-item__link') as HTMLElement | null;
      if (target) {
        if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
        if (pendingRaf) { cancelAnimationFrame(pendingRaf); pendingRaf = null; }

        currentTarget = target;
        const newRects = getRects(target);

        if (!hasPosition) {
          rects = newRects;
          hasPosition = true;
        } else {
          const seed = rects[0] || newRects[0];
          const padded = [...rects];
          while (padded.length < newRects.length) {
            padded.push({ ...seed });
          }
          rects = padded.slice(0, newRects.length);
          pendingRaf = requestAnimationFrame(() => {
            rects = newRects;
            pendingRaf = null;
          });
        }
        visible = true;
      }
    }

    function handleMouseOut(e: MouseEvent) {
      const target = (e.target as HTMLElement)?.closest('.talk-item__link') as HTMLElement | null;
      const related = (e.relatedTarget as HTMLElement)?.closest('.talk-item__link') as HTMLElement | null;
      if (target && !related) {
        hideTimeout = setTimeout(() => {
          visible = false;
          currentTarget = null;
          hasPosition = false;
          if (pendingRaf) { cancelAnimationFrame(pendingRaf); pendingRaf = null; }
          hideTimeout = null;
        }, 60);
      }
    }

    function handleScroll() {
      if (currentTarget && visible) {
        rects = getRects(currentTarget);
      }
    }

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      window.removeEventListener('scroll', handleScroll);
      if (hideTimeout) clearTimeout(hideTimeout);
      if (pendingRaf) cancelAnimationFrame(pendingRaf);
    };
  });
</script>

<div class="hover-highlight-group" class:hover-highlight-group--visible={visible}>
  {#each rects as rect, i (i)}
    <div
      class="hover-highlight-rect"
      style={`left: ${rect.x}px; top: ${rect.y}px; width: ${rect.width}px; height: ${rect.height}px;`}
    ></div>
  {/each}
</div>

<style>
  .hover-highlight-group {
    pointer-events: none;
    position: fixed;
    inset: 0;
    z-index: 0;
    opacity: 0;
    transition: opacity 0.15s ease;
    filter: drop-shadow(0 1px 4px rgba(0, 0, 0, 0.06)) drop-shadow(0 4px 12px rgba(0, 0, 0, 0.04));
  }

  .hover-highlight-group--visible {
    opacity: 1;
  }

  .hover-highlight-rect {
    position: fixed;
    border-radius: 5px;
    background-color: var(--color-off-white, #fffaf0);
    transition: left 0.12s ease, top 0.12s ease, width 0.12s ease, height 0.12s ease;
  }
</style>
