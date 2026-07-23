<script lang="ts">
  import { onMount } from 'svelte';

  let { videoId }: { videoId: string } = $props();

  let player: any = null;
  let playerReady = $state(false);
  const playerId = `yt-player-${videoId}`;
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
