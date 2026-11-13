<script setup lang="ts">
import type { TestDefinition, NoteDefinition } from '../../shared/types/platform'
const { data: tests, error: testError, refresh: refreshTests } = await useFetch<TestDefinition[]>('/api/platform/tests')
const { data: notes, error: noteError, refresh: refreshNotes } = await useFetch<NoteDefinition[]>('/api/platform/notes')
// Главная использует те же опубликованные материалы, что и страницы тестов и конспектов.
usePlatformSync(() => Promise.all([refreshTests(), refreshNotes()]))
</script>
<template>
  <section class="desk-section" aria-labelledby="teacher-materials">
    <header class="desk-section-heading">
      <div><h2 id="teacher-materials" class="desk-title">От преподавателя</h2><p>Последние опубликованные тесты и конспекты.</p></div>
    </header>
    <p v-if="testError || noteError" role="alert" class="people-alert people-alert-error">Не удалось обновить материалы. Повторим при восстановлении соединения.</p>
    <div class="student-materials">
      <section class="desk-surface desk-list">
        <header class="desk-row"><h3 class="desk-row-title">Тесты</h3><NuxtLink to="/tests" class="desk-text-button">Все тесты <span aria-hidden="true">→</span></NuxtLink></header>
        <NuxtLink v-for="test in (tests || []).slice().reverse().slice(0, 4)" :key="test.id" :to="{ path: '/tests', query: { id: test.id } }" class="desk-row">
          <span class="desk-row-title">{{ test.title }}<span class="desk-row-meta">Вопросов: {{ test.questions.length }} · порог {{ test.passPercent }}%</span></span>
          <span class="action-arrow text-accent" aria-hidden="true">→</span>
        </NuxtLink>
        <p v-if="!tests?.length && !testError" class="desk-row text-sm text-muted">Преподаватель пока не опубликовал тесты.</p>
      </section>
      <section class="desk-surface desk-list">
        <header class="desk-row"><h3 class="desk-row-title">Конспекты</h3><NuxtLink to="/notes" class="desk-text-button">Все конспекты <span aria-hidden="true">→</span></NuxtLink></header>
        <NuxtLink v-for="note in (notes || []).slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4)" :key="note.id" :to="{ path: '/notes', query: { id: note.id } }" class="desk-row">
          <span class="desk-row-title">{{ note.title }}</span><span class="action-arrow text-accent" aria-hidden="true">→</span>
        </NuxtLink>
        <p v-if="!notes?.length && !noteError" class="desk-row text-sm text-muted">Преподаватель пока не опубликовал конспекты.</p>
      </section>
    </div>
  </section>
</template>
