<script setup lang="ts">
withDefaults(defineProps<{
  as?: 'div' | 'nav'
  count: number
  index: number
  wrap?: boolean
}>(), { as: 'div' })
</script>

<template>
  <component
    :is="as"
    class="segmented-control"
    :class="{ 'segmented-control-wrap': wrap }"
    :style="{
      '--segments': count,
      '--segment-index': index,
      '--segment-mobile-column': index % 2,
      '--segment-mobile-row': Math.floor(index / 2),
      '--segment-mobile-rows': Math.ceil(count / 2),
    }"
  >
    <slot />
  </component>
</template>
