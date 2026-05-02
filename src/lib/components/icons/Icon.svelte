<!-- Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0. -->
<script lang="ts">
  import { iconMap, type IconName } from "./icon-map";

  interface Props {
    icon: IconName;
    className?: string;
    strokeWidth?: number;
    [key: string]: any;
  }

  // eslint-disable-next-line svelte/valid-compile
  let { icon, ...rest }: Props = $props();

  const Component = $derived(iconMap[icon]);
</script>

{#if Component}
  <Component {...rest} />
{/if}
