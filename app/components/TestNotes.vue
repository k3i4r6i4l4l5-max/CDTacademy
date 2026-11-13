<script setup lang="ts">
const props = defineProps<{ text: string }>()
const html = computed(() => renderNote(props.text))
</script>
<template>
  <article class="note-content" v-html="html" />
</template>
