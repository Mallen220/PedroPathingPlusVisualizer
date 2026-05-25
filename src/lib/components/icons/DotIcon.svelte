<!-- Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0. -->
<script lang="ts">
  interface Props {
    className?: string;
  }
  let { className = "" }: Props = $props();
</script>

<span
  class="inline-block select-none leading-none {className}"
  aria-hidden="true"
>
  •
</span>
