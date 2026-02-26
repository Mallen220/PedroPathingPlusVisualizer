<script lang="ts">
  export let degrees: number = 0;
  export let size: number = 16;
  export let className: string = "";
</script>

<div
  class="inline-flex items-center justify-center shrink-0 {className}"
  style="transform: rotate({-degrees}deg); width: {size}px; height: {size}px; transition: transform 0.2s ease-out;"
  role="presentation"
  aria-hidden="true"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    class="w-full h-full text-purple-600 dark:text-purple-400"
  >
    <!-- Circle border -->
    <circle
      cx="12"
      cy="12"
      r="10"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      class="opacity-30"
    />
    <!-- Arrow pointing RIGHT (0 degrees) -->
    <!-- Simple triangle: Tip at (17, 12), Base at (9, 7) and (9, 17) -->
    <!-- Wait, let's make it look like a compass needle or simple arrow -->
    <path d="M17 12L7 7V17L17 12Z" />

    <!-- Center dot -->
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
</div>
