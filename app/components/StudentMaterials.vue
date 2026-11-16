<script setup lang="ts">
import { resultOf } from '#shared/utils/platform'
import type { TestDefinition, NoteDefinition, Submission } from '../../shared/types/platform'
const { data: tests, error: testError, refresh: refreshTests } = await useFetch<TestDefinition[]>('/api/platform/tests')
const { data: notes, error: noteError, refresh: refreshNotes } = await useFetch<NoteDefinition[]>('/api/platform/notes')
// Главная использует те же опубликованные материалы, что и страницы тестов и конспектов.
const { data: submissions, error: resultsError, refresh: refreshResults } = await useFetch<Submission[]>('/api/platform/submissions')
const recent = computed(() => (submissions.value || []).slice().sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).slice(0, 4))
const started = computed(() => new Set((submissions.value || []).map(attempt => attempt.testId)))
const upcoming = computed(() => (tests.value || []).slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).sort((a, b) => Number(started.value.has(a.id)) - Number(started.value.has(b.id))).slice(0, 4))
usePlatformSync(() => Promise.all([refreshTests(), refreshNotes(), refreshResults()]))
</script>
<template>
  <section class="desk-section" aria-labelledby="teacher-materials">
    <header class="desk-section-heading">
      <div><h2 id="teacher-materials" class="desk-title">От преподавателя</h2><p>Опубликованные тесты и конспекты. Тесты без попыток идут первыми.</p></div>
    </header>
    <p v-if="testError || noteError" role="alert" class="people-alert people-alert-error">Не удалось обновить материалы. Повторим при восстановлении соединения.</p>
    <div class="student-materials">
      <section class="desk-surface desk-list">
        <header class="desk-row"><h3 class="desk-row-title">Тесты</h3><NuxtLink to="/tests" class="desk-text-button">Все тесты <span aria-hidden="true">→</span></NuxtLink></header>
        <NuxtLink v-for="test in upcoming" :key="test.id" :to="{ path: '/tests', query: { id: test.id } }" class="desk-row">
          <span class="desk-row-title">{{ test.title }}<span class="desk-row-meta">{{ placementLabel(test.placement) || 'Вопросов: ' + test.questions.length }} · {{ started.has(test.id) ? 'Есть попытка' : 'Без отправки' }}</span></span>
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
  <section class="desk-section" aria-labelledby="recent-grades">
    <header class="desk-section-heading">
      <h2 id="recent-grades" class="desk-title">Недавние результаты</h2>
      <NuxtLink to="/tests?view=results" class="desk-text-button">Все результаты →</NuxtLink>
    </header>
    <p v-if="resultsError" role="alert" class="people-alert people-alert-error">Не удалось загрузить оценки. <button class="underline" @click="refreshResults()">Повторить</button></p>
    <div v-else-if="recent.length" class="desk-surface desk-list">
      <NuxtLink v-for="attempt in recent" :key="attempt.id" :to="{ path: '/tests', query: { view: 'results', attempt: attempt.id } }" class="desk-row">
        <div><strong class="desk-row-title">{{ attempt.testTitle }}</strong><p class="desk-row-meta">{{ new Date(attempt.submittedAt).toLocaleDateString('ru-RU') }}</p></div>
        <span class="desk-chip" :data-tone="attemptStatus(resultOf(attempt)).tone">{{ resultOf(attempt).pending ? 'На проверке' : resultOf(attempt).percent + '% · ' + attemptStatus(resultOf(attempt)).label }}</span>
      </NuxtLink>
    </div>
    <p v-else class="desk-surface desk-empty text-sm text-muted">Здесь появятся оценки и комментарии после отправки первого теста.</p>
  </section>
</template>
