<script setup lang="ts">
defineProps<{ text: string }>()
// Отображаем текст и ограждённые блоки кода без исполнения HTML из конспекта.
</script>
<template><article class="space-y-4 text-sm leading-7"><template v-for="(part, i) in text.split('```')" :key="i"><pre v-if="i % 2" class="overflow-x-auto rounded-lg border border-line bg-soft p-4 font-mono text-xs leading-6"><code>{{ part.replace(/^(?:js|javascript|ts)?\r?\n/, '') }}</code></pre><p v-else class="whitespace-pre-wrap text-muted">{{ part }}</p></template></article></template>
