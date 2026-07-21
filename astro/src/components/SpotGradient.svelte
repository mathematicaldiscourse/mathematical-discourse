<script lang="ts">
  import { onMount } from 'svelte';
  import { hexToRgb, DEFAULT_HIGHLIGHT } from '../lib/color';

  let { color = DEFAULT_HIGHLIGHT }: { color?: string } = $props();

  let targetColor = { r: 0, g: 0, b: 0 };
  let currentColor = { r: 0, g: 0, b: 0 };
  let displayRgb = $state('217, 255, 2');

  function toRgbObject(hex: string): { r: number; g: number; b: number } {
    const [r, g, b] = hexToRgb(hex);
    return { r, g, b };
  }

  function setColor(hex: string) {
    targetColor = toRgbObject(hex || DEFAULT_HIGHLIGHT);
  }

  let pointerY: number | null = null;

  // [data-spot-gated] elements (issue rows on the issues page) only drive
  // the gradient while their [data-expand-gate] talks container is visible;
  // collapsed or unexpandable rows are inert. Ungated elements (issue/talk
  // page spans) always count.
  function isEligible(el: HTMLElement): boolean {
    if (!el.hasAttribute('data-spot-gated')) return true;
    const gate = el.querySelector<HTMLElement>('[data-expand-gate]');
    return !!gate && !gate.hidden;
  }

  function findNearestSpotColor(): string | null {
    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-spot-color]')).filter(isEligible);
    if (targets.length === 0) return null;

    // Prefer the user's pointer Y if known; fall back to viewport center.
    const referenceY = pointerY ?? window.innerHeight / 2;
    let nearestEl: HTMLElement | null = null;
    let nearestDistance = Infinity;

    for (const el of targets) {
      const rect = el.getBoundingClientRect();
      // Distance to nearest edge of the element (0 if cursor is over it).
      const distance = rect.top > referenceY
        ? rect.top - referenceY
        : rect.bottom < referenceY
          ? referenceY - rect.bottom
          : 0;
      // An expanded issue row drives the gradient only while the pointer is
      // actually within it — hovering elsewhere (e.g. a collapsed row
      // further down) rests at the base color.
      if (el.hasAttribute('data-spot-gated') && distance > 0) continue;
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestEl = el;
      }
    }

    return nearestEl?.dataset.spotColor || null;
  }

  onMount(() => {
    const initialHex = findNearestSpotColor() || color || DEFAULT_HIGHLIGHT;
    const initial = toRgbObject(initialHex);
    currentColor = { ...initial };
    targetColor = { ...initial };
    displayRgb = `${initial.r}, ${initial.g}, ${initial.b}`;

    let frame: number;
    function animate() {
      // Color damping
      const colorDamping = 0.03;
      currentColor.r += (targetColor.r - currentColor.r) * colorDamping;
      currentColor.g += (targetColor.g - currentColor.g) * colorDamping;
      currentColor.b += (targetColor.b - currentColor.b) * colorDamping;
      displayRgb = `${Math.round(currentColor.r)}, ${Math.round(currentColor.g)}, ${Math.round(currentColor.b)}`;

      frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);

    // Sync handler: pick the [data-spot-color] element nearest the user's
    // current focus point — pointer Y if known, viewport center otherwise.
    // Triggered by scroll, resize, and mousemove (all rAF-throttled).
    let scrollFrame: number | null = null;
    function sync() {
      if (scrollFrame !== null) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = null;
        // No eligible target (e.g. expanded-only mode with everything
        // collapsed) → rest at the page's base color.
        setColor(findNearestSpotColor() || color || DEFAULT_HIGHLIGHT);
      });
    }

    function onPointerMove(e: PointerEvent) {
      pointerY = e.clientY;
      sync();
    }

    function onPointerLeave() {
      pointerY = null;
      sync();
    }

    // Re-sync when an issue expands/collapses.
    function onIssueToggle() {
      sync();
    }

    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('md-issue-toggle', onIssueToggle);

    return () => {
      cancelAnimationFrame(frame);
      if (scrollFrame !== null) cancelAnimationFrame(scrollFrame);
      window.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('md-issue-toggle', onIssueToggle);
    };
  });
</script>

<div class="spot-gradient">
  <div
    class="spot-gradient__blob"
    style={`background: radial-gradient(circle at center, rgba(${displayRgb}, 0.35) 0%, rgba(${displayRgb}, 0) 65%);`}
  ></div>
</div>

<style>
  .spot-gradient {
    position: fixed;
    inset: 0;
    z-index: -1;
    overflow: hidden;
    pointer-events: none;
  }

  .spot-gradient__blob {
    position: absolute;
    width: 70vmax;
    height: 70vmax;
    right: -20vmax;
    bottom: -20vmax;
    animation: morph 30s ease-in-out infinite alternate;
  }

  @keyframes morph {
    0% {
      border-radius: 40% 60% 60% 40% / 60% 30% 70% 40%;
      transform: scale(1) rotate(0deg);
    }
    25% {
      border-radius: 60% 40% 30% 70% / 40% 60% 40% 60%;
      transform: scale(1.08) rotate(45deg);
    }
    50% {
      border-radius: 30% 70% 50% 50% / 50% 40% 60% 50%;
      transform: scale(0.95) rotate(90deg);
    }
    75% {
      border-radius: 50% 30% 60% 40% / 30% 70% 40% 60%;
      transform: scale(1.05) rotate(135deg);
    }
    100% {
      border-radius: 45% 55% 45% 55% / 55% 45% 55% 45%;
      transform: scale(1) rotate(180deg);
    }
  }
</style>
