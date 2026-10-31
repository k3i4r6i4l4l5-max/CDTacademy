<script setup lang="ts">
import type { NoteDefinition } from '../../shared/types/platform'
const { data: notes, error, refresh } = await useFetch<NoteDefinition[]>('/api/platform/notes', { query: { audience: 'student' } })
usePlatformSync(() => refresh())
const route = useRoute()
const selected = ref(String(route.query.id || ''))
const active = computed(() => notes.value?.find(n => n.id === selected.value))
useHead({ title: computed(() => active.value ? `${active.value.title} — практика` : 'Конспекты — практика') })
</script>
<template><main class="mx-auto max-w-4xl px-5 py-12"><NuxtLink to="/tests" class="text-sm text-muted">← Тесты и задания</NuxtLink><h1 class="page-title mt-6">{{ active ? active.title : 'Конспекты' }}</h1><p v-if="error" role="alert" class="mt-5 text-accent">Не удалось загрузить конспекты. Обновите страницу.</p><template v-if="active"><button class="my-6 text-sm text-accent" @click="selected = ''">← Все конспекты</button><section class="panel"><TestNotes :text="active.body" /></section></template><template v-else><p class="mt-4 text-sm text-muted">Учебные материалы и примеры от преподавателей.</p><div class="mt-8 grid gap-4 sm:grid-cols-2"><article v-for="note in notes" :key="note.id" class="panel"><h2 class="text-xl">{{ note.title }}</h2><p class="my-4 text-xs text-muted">Обновлён {{ new Date(note.updatedAt).toLocaleDateString('ru-RU') }}</p><button class="text-sm text-accent" @click="selected = note.id">Читать конспект →</button></article></div><p v-if="!notes?.length && !error" class="mt-8 text-sm text-muted">Опубликованных конспектов пока нет.</p></template></main></template>
