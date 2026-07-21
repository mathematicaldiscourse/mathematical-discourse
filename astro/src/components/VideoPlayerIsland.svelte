<script lang="ts">
  import { onMount } from 'svelte';

  let { videoId }: { videoId: string } = $props();

  let player: any = null;
  let playerReady = $state(false);
  // Deterministic id (from the video id) so the server-rendered iframe and the
  // hydrated component always agree on the element to attach to.
  const playerId = `yt-player-${videoId}`;
  // enablejsapi=1 lets us attach the YouTube Player API to this iframe for the
  // table-of-contents seek feature. The iframe is in the markup, so the video
  // always loads even if that API is slow to load or fails.
  // youtube-nocookie.com is YouTube's privacy-enhanced mode: it doesn't set
  // tracking cookies until the visitor actually plays the video. The JS API
  // still works because it reads this iframe's own domain to communicate.
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&modestbranding=1&rel=0`;

  function timestampToSeconds(ts: string): number {
    const parts = ts.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] ?? 0;
  }

  function seekTo(timestamp: string) {
    const seconds = timestampToSeconds(timestamp);
    if (player && playerReady && typeof player.seekTo === 'function') {
      player.seekTo(seconds, true);
      if (player.getPlayerState && player.getPlayerState() !== 1) {
        player.playVideo();
      }
    }
  }

  function handleTocSeek(e: CustomEvent<{ timestamp: string }>) {
    seekTo(e.detail.timestamp);
  }

  onMount(() => {
    // Attach the API to the iframe that's already in the page. This only powers
    // the seek-to-timestamp feature; the video itself is the plain iframe below.
    function attachPlayer() {
      const el = document.getElementById(playerId);
      if (!el || !(window as any).YT?.Player) return;
      player = new (window as any).YT.Player(playerId, {
        events: {
          onReady: () => {
            playerReady = true;
          },
        },
      });
    }

    if (!(window as any).YT || !(window as any).YT.Player) {
      const existingCallback = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (existingCallback) existingCallback();
        attachPlayer();
      };

      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
    } else {
      attachPlayer();
    }

    document.addEventListener('toc-seek', handleTocSeek as EventListener);

    return () => {
      document.removeEventListener('toc-seek', handleTocSeek as EventListener);
      if (player && typeof player.destroy === 'function') {
        player.destroy();
      }
    };
  });
</script>

<div data-video-player class="relative w-full max-w-6xl aspect-video [&>iframe]:absolute [&>iframe]:inset-0 [&>iframe]:w-full [&>iframe]:h-full">
  <iframe
    id={playerId}
    src={embedUrl}
    title="Talk video"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
  ></iframe>
</div>
