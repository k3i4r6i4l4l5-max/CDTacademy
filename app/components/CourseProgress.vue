<script setup lang="ts">
const props = defineProps<{ solved: number; total: number }>()
const fraction = computed(() => props.total ? props.solved / props.total : 0)
</script>

<template>
  <div>
    <div class="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
      <span class="text-muted">Задания выполнены</span>
      <strong class="tabular-nums text-ink">{{ solved }} / {{ total }}</strong>
    </div>
    <div class="progress-track" role="progressbar" aria-label="Прогресс по заданиям"
      :aria-valuenow="solved" :aria-valuemin="0" :aria-valuemax="total"
      :aria-valuetext="solved + ' из ' + total + ' заданий выполнено'">
      <span :style="{ transform: 'scaleX(' + fraction + ')' }" />
    </div>
  </div>
</template>
