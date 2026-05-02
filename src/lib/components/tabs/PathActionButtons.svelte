<!-- Copyright 2026 Matthew Allen. Licensed under the Modified Apache License, Version 2.0. -->
<!-- src/lib/components/tabs/PathActionButtons.svelte -->
<script lang="ts">
  import { Icon } from "../icons/index";
  import { actionRegistry } from "../../actionRegistry";
  import { getButtonFilledClass } from "../../../utils/buttonStyles";
  import { getShortcutFromSettings } from "../../../utils";

  interface Props {
    settings: any;
    onAddLine: () => void;
    onHandleAddAction: (def: any) => void;
  }

  let { settings, onAddLine, onHandleAddAction }: Props = $props();

  function getButtonColorClass(color: string) {
    return getButtonFilledClass(color);
  }
</script>

{#each Object.values($actionRegistry) as def (def.kind)}
  {#if def.createDefault || def.isPath}
    <button
      onclick={() => {
        if (def.isPath) onAddLine();
        else onHandleAddAction(def);
      }}
      title={def.isPath
        ? `Add Path${getShortcutFromSettings(settings, "add-path")}`
        : `Add ${def.label}`}
      class={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 ${getButtonColorClass(def.buttonColor || "gray")}`}
      aria-label={`Add ${def.label}`}
    >
      {#if def.kind === "path"}
        <Icon icon="PlusIcon" className="size-4" strokeWidth={2} />
      {:else if def.kind === "wait"}
        <Icon icon="ClockIcon" className="size-4" />
      {:else if def.kind === "rotate"}
        <Icon icon="ArrowCircleIcon" className="size-4" />
      {:else}
        <Icon icon="PlusIcon" className="size-4" strokeWidth={2} />
      {/if}
      Add {def.label}
    </button>
  {/if}
{/each}
