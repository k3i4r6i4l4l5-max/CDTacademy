<script setup lang="ts">
import { lessons } from '~/data/course'

const { answers, selected, solved, totalExercises, isComplete } = useLearning()
const started = computed(() => selected.value !== lessons[0]!.id || Object.keys(answers.value).length > 0)
const attempted = computed(() => new Set(Object.keys(answers.value).map(key => key.split(':')[0])))
useHead({ title: 'Основы JavaScript — практика' })
</script>

<template>
  <main class="workspace-page workspace-page-medium">
    <nav class="mb-4" aria-label="Путь к курсу">
      <NuxtLink to="/lessons" class="desk-text-button">← Учебный каталог</NuxtLink>
    </nav>
    <header class="desk-header">
      <div>
        <p class="eyebrow">Информатика</p>
        <h1 class="page-title">Основы JavaScript</h1>
        <p class="desk-lead">{{ lessons.length }} уроков · {{ totalExercises }} заданий</p>
      </div>
      <NuxtLink to="/learn" class="button-primary">
        {{ started ? 'Продолжить курс' : 'Начать курс' }} <span aria-hidden="true">→</span>
      </NuxtLink>
    </header>
    <div class="desk-surface desk-form-section mb-6">
      <CourseProgress :solved="solved" :total="totalExercises" />
    </div>
    <section aria-labelledby="javascript-outline">
      <h2 id="javascript-outline" class="desk-title mb-4">Уроки курса</h2>
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
