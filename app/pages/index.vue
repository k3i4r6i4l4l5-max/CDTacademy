<script setup lang="ts">
import { lessons } from '~/data/course'

const { user, staff } = useAuth()
const { selected, solved, totalExercises, answers } = useLearning()
const current = computed(() => lessons.find(lesson => lesson.id === selected.value) ?? lessons[0]!)
const started = computed(() => Object.keys(answers.value).length > 0 || current.value !== lessons[0])
useHead({ title: 'Учебная практика', htmlAttrs: { lang: 'ru' } })
</script>

<template>
  <main class="workspace-page dashboard-page">
    <header class="desk-header enter">
      <div>
        <p class="eyebrow">{{ user?.role === 'student' ? 'Кабинет студента' : 'Учебная платформа' }}</p>
        <h1 class="page-title">{{ user?.role === 'student' ? 'Моя учёба' : 'Учебная практика' }}</h1>
        <p class="desk-lead">{{ user?.role === 'student' ? 'Занятия, задания преподавателей и результаты в одном месте.' : 'Учебные материалы, тесты и самостоятельные занятия колледжа.' }}</p>
      </div>
      <NuxtLink v-if="staff" to="/admin" class="button-primary">Открыть рабочий стол <span aria-hidden="true">→</span></NuxtLink>
      <NuxtLink v-else-if="user" to="/tests?view=results" class="button-secondary">Мои результаты</NuxtLink>
    </header>

    <section class="dashboard-feature enter" aria-labelledby="resume-title">
      <div class="dashboard-feature-main">
        <p v-if="user?.role === 'student'" class="eyebrow">Самостоятельное обучение</p>
        <h2 id="resume-title" class="desk-title">{{ user?.role === 'student' && started ? current.title : 'Учебный каталог' }}</h2>
        <p>{{ user?.role === 'student' && started ? current.description : 'Найдите занятие, конспект или тест по нужной дисциплине.' }}</p>
        <NuxtLink :to="user?.role === 'student' && started ? '/learn' : '/lessons'" class="button-primary">
          {{ user?.role === 'student' && started ? 'Продолжить обучение' : 'Открыть каталог' }} <span aria-hidden="true">→</span>
        </NuxtLink>
      </div>
      <div class="dashboard-feature-side">
        <template v-if="user?.role === 'student'">
          <NuxtLink to="/courses/javascript" class="desk-text-button">Основы JavaScript →</NuxtLink>
          <CourseProgress class="mt-2" :solved="solved" :total="totalExercises" />
        </template>
        <template v-else>
          <p class="desk-row-title">Материалы преподавателей</p>
          <p class="text-sm text-muted">В кабинете доступны опубликованные конспекты, тесты и оценки.</p>
          <NuxtLink :to="user ? '/notes' : '/login'" class="desk-text-button">{{ user ? 'К конспектам' : 'Войти в кабинет' }} <span aria-hidden="true">→</span></NuxtLink>
        </template>
      </div>
    </section>

    <StudentMaterials v-if="user?.role === 'student'" />
    <section v-else-if="!user" class="desk-section" aria-labelledby="start-heading">
      <header class="desk-section-heading"><h2 id="start-heading" class="desk-title">С чего начать</h2></header>
      <div class="desk-surface desk-list">
        <NuxtLink to="/lessons" class="desk-row">
          <span class="min-w-0"><strong class="desk-row-title">Самостоятельные занятия</strong><span class="desk-row-meta">{{ lessons.length }} занятий с теорией, практикой и проверкой.</span></span><span class="action-arrow text-accent" aria-hidden="true">→</span>
        </NuxtLink>
        <NuxtLink to="/notes" class="desk-row">
          <span class="min-w-0"><strong class="desk-row-title">Конспекты преподавателей</strong><span class="desk-row-meta">Теория и разобранные примеры по дисциплинам.</span></span><span class="action-arrow text-accent" aria-hidden="true">→</span>
        </NuxtLink>
        <NuxtLink to="/tests" class="desk-row">
          <span class="min-w-0"><strong class="desk-row-title">Тесты и задания</strong><span class="desk-row-meta">Отправка работ, оценки и комментарии преподавателей.</span></span><span class="action-arrow text-accent" aria-hidden="true">→</span>
        </NuxtLink>
      </div>
    </section>
  </main>
</template>
