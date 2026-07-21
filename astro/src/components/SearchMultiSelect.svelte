<script lang="ts">
  import { onMount } from 'svelte';

  let {
    label,
    options,
    values = $bindable<string[]>([]),
    onchange,
  }: {
    label: string;
    options: { value: string; label: string }[];
    values: string[];
    onchange?: () => void;
  } = $props();

  let open = $state(false);
  let triggerEl: HTMLButtonElement | undefined = $state();
  let dropdownEl: HTMLDivElement | undefined = $state();

  function toggle(val: string) {
    if (values.includes(val)) {
      values = values.filter(v => v !== val);
    } else {
      values = [...values, val];
    }
    onchange?.();
  }

  function getDisplayLabel(): string {
    if (values.length === 0) return 'All';
    if (values.length === 1) {
      const opt = options.find(o => o.value === values[0]);
      return opt?.label ?? values[0];
    }
    return `${values.length} selected`;
  }

  function handleClickOutside(e: MouseEvent) {
    if (open && triggerEl && dropdownEl && !triggerEl.contains(e.target as Node) && !dropdownEl.contains(e.target as Node)) {
      open = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) {
      open = false;
      triggerEl?.focus();
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<div class="relative">
  <button
    bind:this={triggerEl}
    onclick={() => open = !open}
    aria-expanded={open}
    class="flex items-center gap-3 border-b-2 border-black py-2 font-mono text-base cursor-pointer bg-transparent w-full lg:w-auto"
  >
    <span class="shrink-0">{label}:</span>
    <span class="font-medium text-[#636363]">{getDisplayLabel()}</span>
    <svg class="size-2.5 shrink-0 transition-transform duration-150 {open ? 'rotate-180' : ''}" aria-hidden="true" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1 1L5 5L9 1" />
    </svg>
  </button>

  {#if open}
    <div
      bind:this={dropdownEl}
      class="absolute top-full left-0 mt-1 min-w-full w-max bg-off-white border border-black rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
    >
      {#each options as opt}
        <label class="flex items-center gap-3 px-4 py-2 font-mono text-sm cursor-pointer hover:bg-highlighter">
          <input
            type="checkbox"
            checked={values.includes(opt.value)}
            onchange={() => toggle(opt.value)}
            class="accent-black"
          />
          {opt.label}
        </label>
      {/each}
    </div>
  {/if}
</div>
