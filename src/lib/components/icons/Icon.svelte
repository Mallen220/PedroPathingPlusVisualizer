<!-- Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0. -->
<script lang="ts">
  import { iconMap as defaultIconMap, type IconName } from "./icon-map";
  import * as animatedMap from "./too-many-animations-map";
  import { settingsStore } from "../../projectStore";

  interface Props {
    icon: IconName;
    className?: string;
    strokeWidth?: number;
    [key: string]: any;
  }

  // eslint-disable-next-line svelte/valid-compile
  let { icon, ...rest }: Props = $props();

  const Component = $derived(
    $settingsStore?.iconTheme === "too-many-animations" &&
      animatedMap.iconMap[icon]
      ? animatedMap.iconMap[icon]
      : defaultIconMap[icon],
  );
</script>

{#if Component}
  <Component {...rest} />
{/if}
