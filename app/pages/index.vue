<script setup lang="ts">
import { lessons } from '~/data/course'

const { user } = useAuth()
const { answers, completed, selected } = useLearning()
const lesson = computed(() => lessons.find(item => item.id === selected.value) ?? lessons[0]!)
const started = computed(() => selected.value !== lessons[0]!.id || Object.keys(answers.value).length > 0)
const percent = computed(() => Math.round(completed.value / lessons.length * 100))
const exerciseCount = lessons.reduce((count, item) => count + item.theory.length + 1, 0)
const studySteps = [
  { icon: 'notes', title: 'Разберите пример', description: 'Короткая теория и работающий код к каждой теме.' },
  { icon: 'learn', title: 'Напишите решение', description: 'Попробуйте сами в редакторе с подсветкой синтаксиса.' },
  { icon: 'tests', title: 'Проверьте себя', description: 'Автоматическая проверка покажет, где нужно исправить код.' },
]

useHead({
  title: 'Практика — учитесь писать код',
  htmlAttrs: { lang: 'ru' },
  meta: [{ name: 'description', content: 'Курс JavaScript с примерами, редактором и автоматической проверкой решений.' }],
})
</script>

<template>
  <main class="home-page">
    <section v-if="user" class="desk-feature enter" aria-labelledby="home-title">
      <div class="min-w-0">
        <p class="eyebrow">{{ user.role === 'student' ? 'Кабинет студента' : user.role === 'teacher' ? 'Кабинет преподавателя' : 'Кабинет администратора' }}</p>
        <h1 id="home-title" class="page-title mt-2">{{ user.role === 'student' ? 'Моя учёба' : 'Управление обучением' }}</h1>
        <p class="mt-3 text-sm">{{ user.role === 'student' ? 'Откройте задания преподавателя или продолжите самостоятельный курс JavaScript.' : 'Тесты, конспекты и результаты студентов собраны в рабочем кабинете.' }}</p>
        <NuxtLink :to="user.role === 'student' ? '/tests' : '/admin'" class="button-primary mt-5">
          {{ user.role === 'student' ? 'К заданиям' : 'Открыть кабинет' }} <span class="action-arrow" aria-hidden="true">→</span>
        </NuxtLink>
      </div>
      <div class="desk-feature-side min-w-0">
        <ProfileAvatar :user="user" class="profile-avatar" />
        <p class="mt-2 break-words font-medium">{{ user.login }}</p>
        <NuxtLink to="/profile" class="desk-text-button">{{ user.role === 'student' ? 'Профиль и группа' : 'Мой профиль' }} <span aria-hidden="true">→</span></NuxtLink>
      </div>
    </section>
    <section v-else class="home-hero" aria-labelledby="home-title">
      <div class="home-intro enter">
        <p class="home-label"><span aria-hidden="true" /> Самостоятельный курс</p>
        <h1 id="home-title">JavaScript<br> с&nbsp;нуля</h1>
        <p class="home-description">Изучайте JavaScript по шагам. Разберите пример, напишите свой код и сразу проверьте, что получилось.</p>
        <NuxtLink to="/learn" class="button-primary home-start">
          {{ started ? 'Продолжить обучение' : 'Начать учиться' }}
          <span class="action-arrow" aria-hidden="true">→</span>
        </NuxtLink>
      </div>

      <div class="home-example enter">
        <figure class="example-window">
          <figcaption class="example-heading">
            <span><span class="example-mark" aria-hidden="true">JS</span> Пример кода</span>
            <span class="font-mono">double.js</span>
          </figcaption>
          <pre class="example-code"><code><span class="code-keyword">function</span> <span class="code-name">double</span>(value) {
  <span class="code-keyword">return</span> value * <span class="code-number">2</span>
}

<span class="code-name">double</span>(<span class="code-number">6</span>)</code></pre>
          <div class="example-output"><span>Результат</span><code class="enter"><span aria-hidden="true">→</span> 12</code></div>
        </figure>
      </div>
    </section>

    <StudentMaterials v-if="user?.role === 'student'" />

    <section class="home-course enter" aria-labelledby="course-title">
      <div class="home-course-copy">
        <p class="eyebrow">Самостоятельный курс</p>
        <h2 id="course-title">{{ user ? 'JavaScript с нуля' : 'Основы языка на практике' }}</h2>
        <p>{{ lessons.length }} уроков · {{ exerciseCount }} заданий · Начальный уровень</p>
      </div>
      <div class="home-progress">
        <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span class="text-sm font-medium">Ваш прогресс</span>
          <span class="text-xs text-muted">{{ completed }} из {{ lessons.length }} уроков</span>
        </div>
        <div
          class="progress-track" role="progressbar" aria-label="Прогресс курса"
          :aria-valuenow="percent" :aria-valuemin="0" :aria-valuemax="100"
        >
          <span :style="{ transform: `scaleX(${percent / 100})` }" />
        </div>
        <NuxtLink to="/learn" class="progress-link">
          {{ started ? 'Текущий урок' : 'Первый урок' }} · {{ lesson.title }}
          <span class="action-arrow" aria-hidden="true">→</span>
        </NuxtLink>
      </div>
    </section>

    <section v-if="!user" class="home-method enter" aria-labelledby="method-title">
      <h2 id="method-title">Как устроен урок</h2>
      <ul class="home-steps">
        <li v-for="step in studySteps" :key="step.icon">
          <span class="step-icon" aria-hidden="true"><span class="nav-icon" :class="'nav-icon-' + step.icon" /></span>
          <div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.description }}</p>
          </div>
        </li>
      </ul>
    </section>

    <footer class="home-footer">Ответы и прогресс курса сохраняются в этом браузере.</footer>
  </main>
</template>
