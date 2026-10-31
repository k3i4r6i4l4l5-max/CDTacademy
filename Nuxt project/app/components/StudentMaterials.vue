<script setup lang="ts">
import type { TestDefinition, NoteDefinition } from '../../shared/types/platform'
const { data: tests, error: testError, refresh: refreshTests } = await useFetch<TestDefinition[]>('/api/platform/tests')
const { data: notes, error: noteError, refresh: refreshNotes } = await useFetch<NoteDefinition[]>('/api/platform/notes')
// Главная использует те же опубликованные материалы, что и страницы тестов и конспектов.
usePlatformSync(() => Promise.all([refreshTests(), refreshNotes()]))
</script>
<template>
  <section class="mt-10 border-t border-line pt-7"><div class="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 class="text-xl">От преподавателя</h2><span class="people-chip tone-student">Обновляется автоматически</span></div>
    <p v-if="testError || noteError" role="alert" class="mb-4 text-sm text-accent">Не удалось обновить материалы. Повторим при восстановлении соединения.</p>
    <div class="grid gap-4 sm:grid-cols-2"><article class="panel"><h3 class="mb-4 text-base font-medium">Тесты <span class="ml-2 text-muted">{{ tests?.length || 0 }}</span></h3><NuxtLink v-for="test in tests" :key="test.id" :to="{path:'/tests',query:{id:test.id}}" class="mb-3 block rounded-lg bg-[#f8eee5] p-3 text-sm text-accent">{{ test.title }} <span class="float-right">→</span><span class="mt-1 block text-xs text-muted">{{ test.questions.length }} вопросов · порог {{ test.passPercent }}%</span></NuxtLink><p v-if="!tests?.length && !testError" class="text-sm text-muted">Преподаватель пока не опубликовал тесты.</p></article>
    <article class="panel"><h3 class="mb-4 text-base font-medium">Конспекты <span class="ml-2 text-muted">{{ notes?.length || 0 }}</span></h3><NuxtLink v-for="note in notes" :key="note.id" :to="{path:'/notes',query:{id:note.id}}" class="mb-3 block rounded-lg bg-[#eef3e8] p-3 text-sm text-[#4f6148]">{{ note.title }} <span class="float-right">→</span></NuxtLink><p v-if="!notes?.length && !noteError" class="text-sm text-muted">Преподаватель пока не опубликовал конспекты.</p></article></div>
  </section>
</template>
