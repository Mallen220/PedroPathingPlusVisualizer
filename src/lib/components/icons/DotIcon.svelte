<!-- Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0. -->
<script lang="ts">
  interface Props {
    className?: string;
    strokeWidth?: number;
  }
  let { className = "w-0.5 h-1", strokeWidth = 2 }: Props = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 2 4"
  fill="currentColor"
  class="inline-block {className}"
>
  <circle cx="1" cy="2" r="1" />
</svg>
