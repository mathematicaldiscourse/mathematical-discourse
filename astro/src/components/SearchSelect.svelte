<script lang="ts">
  import { Select } from 'melt/builders';

  let {
    label,
    options,
    value = $bindable(''),
    onchange,
  }: {
    label: string;
    options: { value: string; label: string }[];
    value: string;
    onchange?: () => void;
  } = $props();

  const select = new Select<string>({
    value: value || undefined,
    onValueChange: (v) => {
      value = v == null ? '' : String(v);
      onchange?.();
    },
  });

  const allOptions = $derived([{ value: '', label: 'All' }, ...options]);

  function getDisplayLabel(val: string): string {
    if (!val) return 'All';
    const opt = options.find(o => o.value === val);
    return opt?.label ?? val;
  }

  function handleNativeChange(e: Event) {
    value = (e.target as HTMLSelectElement).value;
    onchange?.();
  }
</script>

<label class="flex lg:hidden items-center gap-3 border-b-2 border-black py-2 font-mono text-base w-full">
  <span class="shrink-0">{label}:</span>
  <select
    {value}
    onchange={handleNativeChange}
    class="bg-transparent border-none outline-none font-mono text-base font-medium text-[#636363] cursor-pointer text-right flex-1"
  >
    {#each allOptions as opt}
      <option value={opt.value}>{opt.label}</option>
    {/each}
  </select>
</label>

<div class="relative hidden lg:block">
  <button
    {...select.trigger}
    class="flex items-center gap-3 border-b-2 border-black py-2 font-mono text-base cursor-pointer bg-transparent"
  >
    <span>{label}:</span>
    <span class="font-medium text-[#636363]">{getDisplayLabel(value)}</span>
    <svg class="size-2.5 shrink-0" aria-hidden="true" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1 1L5 5L9 1" />
    </svg>
  </button>

  <div
    {...select.content}
    class="absolute top-full left-0 mt-1 min-w-full w-max bg-off-white border border-black rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
  >
    {#each allOptions as opt}
      <div
        {...select.getOption(opt.value, opt.label)}
        class="px-4 py-2 font-mono text-sm cursor-pointer data-[highlighted]:bg-highlighter data-[highlighted]:text-black"
      >
        {opt.label}
      </div>
    {/each}
  </div>
</div>
