<script setup lang="ts">
import { lessons } from '~/data/course'

import type { NoteDefinition, TestDefinition } from '#shared/types/platform'

const { user } = useAuth()
const request = useRequestFetch()
const query = ref('')
const subject = ref('')
const { data: materials, status, error, refresh } = await useAsyncData('curriculum-catalog', async () => {
  if (!user.value) return { notes: [], tests: [] }
  const [notes, tests] = await Promise.all([
    request<NoteDefinition[]>('/api/platform/notes', { query: { audience: 'student' } }),
    request<TestDefinition[]>('/api/platform/tests', { query: { audience: 'student' } }),
  ])
  return { notes, tests }
}, { watch: [() => user.value?.id] })
const published = computed(() => [
  ...(materials.value?.notes || []).map(note => ({ ...note, kind: 'Конспект', path: '/notes' })),
  ...(materials.value?.tests || []).map(test => ({ ...test, kind: 'Тест', path: '/tests' })),
])
const subjects = computed(() => subjectOptions(published.value))
const groups = computed(() => {
  const result = new Map<string, typeof published.value>()
  for (const item of published.value) {
    if (subject.value && subjectOf(item) !== subject.value) continue
    if (![item.title, placementLabel(item.placement)].join(' ').toLocaleLowerCase('ru').includes(query.value.trim().toLocaleLowerCase('ru'))) continue
    const key = subjectOf(item) || 'Общие материалы'
    const group = result.get(key) || []
    group.push(item)
    result.set(key, group)
  }
  return [...result]
})

const { answers, completed, selected, isComplete } = useLearning()
const started = computed(() => selected.value !== lessons[0]!.id || Object.keys(answers.value).length > 0)
const attempted = computed(() => new Set(Object.keys(answers.value).map(key => key.split(':')[0])))
useHead({ title: 'Учебный каталог — практика' })
</script>

<template>
  <main class="workspace-page workspace-page-medium">
    <header class="desk-header">
      <div>
        <h1 class="page-title">Учебный каталог</h1>
        <p class="desk-lead">Занятия для самостоятельного обучения и материалы преподавателей.</p>
      </div>
      <NuxtLink to="/learn" class="button-primary">
        {{ started ? 'Продолжить обучение' : 'Начать с первого урока' }} <span aria-hidden="true">→</span>
      </NuxtLink>
    </header>

    <section v-if="user" class="desk-section mt-0" aria-labelledby="catalog-materials">
      <header class="desk-section-heading"><h2 id="catalog-materials" class="desk-title">По дисциплинам</h2></header>
      <div v-if="published.length" class="desk-surface desk-filter mb-4">
        <label>Поиск<input v-model="query" type="search" class="field mt-2" placeholder="Тема, курс или модуль"></label>
        <label>Дисциплина<select v-model="subject" class="field mt-2"><option value="">Все дисциплины</option><option v-for="value in subjects" :key="value">{{ value }}</option></select></label>
      </div>
      <p v-if="error" class="people-alert people-alert-error" role="alert">Не удалось загрузить материалы. <button class="underline" @click="refresh()">Повторить</button></p>
      <div v-else-if="status === 'pending' && !published.length" class="desk-skeleton" role="status" aria-label="Загрузка материалов" />
      <div v-else-if="groups.length" class="curriculum-grid">
        <section v-for="[name, items] in groups" :key="name" class="desk-surface desk-list">
          <h3 class="desk-row desk-row-title">{{ name }}</h3>
          <NuxtLink v-for="item in items" :key="item.path + item.id" :to="{ path: item.path, query: { id: item.id } }" class="desk-row">
            <span class="min-w-0"><strong class="desk-row-title">{{ item.title }}</strong><span class="desk-row-meta">{{ [item.placement?.course, item.placement?.module].filter(Boolean).join(' / ') }}</span></span>
            <span class="desk-chip">{{ item.kind }}</span>
          </NuxtLink>
        </section>
      </div>
      <p v-else class="desk-surface desk-empty text-sm text-muted">{{ published.length ? 'По этим условиям материалов нет.' : 'Здесь появятся материалы после публикации преподавателем.' }}</p>
    </section>

    <section aria-labelledby="lessons-course-title">
      <header class="desk-section-heading">
        <div><h2 id="lessons-course-title" class="desk-title">Самостоятельные занятия</h2><p>Информатика / Основы JavaScript · Пройдено {{ completed }} из {{ lessons.length }} уроков</p></div>
      </header>
      <ol class="desk-surface desk-list lesson-catalog">
        <li v-for="(lesson, index) in lessons" :key="lesson.id">
          <NuxtLink :to="{ path: '/learn', query: { lesson: lesson.id } }" class="desk-row">
            <div class="flex min-w-0 items-start gap-3">
              <span class="step-icon font-mono text-xs" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
              <div class="min-w-0">
                <h3 class="desk-row-title">{{ lesson.title }}</h3>
                <p class="mt-1 max-w-prose text-sm text-muted">{{ lesson.description }}</p>
                <p class="desk-row-meta">
                  {{ lesson.minutes }} мин · {{ lessonModule(index) }}
                  <span v-if="isComplete(lesson.id)" class="desk-chip" data-tone="good">Пройден</span>
                  <span v-else-if="attempted.has(lesson.id)" class="desk-chip">В процессе</span>
                  <span v-else-if="started && selected === lesson.id" class="desk-chip">Последний открытый</span>
                </p>
              </div>
            </div>
            <span class="action-arrow text-accent" aria-hidden="true">→</span>
          </NuxtLink>
        </li>
      </ol>
    </section>
  </main>
</template>
