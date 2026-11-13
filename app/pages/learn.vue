<script setup lang="ts">
import { lessons } from '~/data/course'
useHead({ title: 'JavaScript с нуля — практика', htmlAttrs: { lang: 'ru' }, meta: [{ name: 'description', content: 'Теория JavaScript, практика и задачи с проверкой кода.' }] })
const { answers, selected, ready, storageError, completed, solved, isComplete, save } = useLearning()
const view = ref<'learn' | 'progress'>('learn')
const tab = ref<'theory' | 'task'>('theory')
const mobileMenu = ref(false)
const lessonTabs = ref<HTMLElement>()
const lessonHeading = ref<HTMLHeadingElement>()
const index = computed(() => Math.max(0, lessons.findIndex(l => l.id === selected.value)))
const lesson = computed(() => lessons[index.value]!)
const percent = computed(() => Math.round(completed.value / lessons.length * 100))
const totalExercises = lessons.reduce((sum, item) => sum + item.theory.length + 1, 0)
function focusLessonHeading() {
  nextTick(() => {
    lessonHeading.value?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: 'instant' })
  })
}
function showProgress() {
  view.value = 'progress'
  mobileMenu.value = false
  focusLessonHeading()
}
function openTask() {
  tab.value = 'task'
  nextTick(() => {
    const taskTab = lessonTabs.value?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')
    taskTab?.focus({ preventScroll: true })
    lessonTabs.value?.scrollIntoView({ block: 'start' })
  })
}
function choose(id: string) {
  selected.value = id
  view.value = 'learn'
  tab.value = 'theory'
  mobileMenu.value = false
  focusLessonHeading()
}
</script>

<template>
  <div class="learning-shell">
    <aside class="learning-program">
      <div class="flex items-center gap-3">
        <span class="example-mark" aria-hidden="true">JS</span>
        <span class="text-sm font-medium">JavaScript с нуля</span>
        <button class="button-secondary ml-auto shrink-0 lg:hidden" :aria-expanded="mobileMenu" aria-controls="lesson-list" @click="mobileMenu = !mobileMenu">Уроки {{ mobileMenu ? '−' : '+' }}</button>
      </div>
      <div class="mt-5">
        <div class="mb-2 flex justify-between gap-2 text-xs text-muted"><span>{{ completed }} из {{ lessons.length }} уроков</span><span>{{ percent }}%</span></div>
        <div class="progress-track" role="progressbar" :aria-valuenow="percent" :aria-valuemin="0" :aria-valuemax="100" aria-label="Прогресс курса">
          <span :style="{ transform: `scaleX(${percent / 100})` }" />
        </div>
      </div>
      <nav id="lesson-list" class="mt-4 space-y-0.5 lg:block" :class="mobileMenu ? 'block enter' : 'hidden'" aria-label="Программа JavaScript">
        <button v-for="(item, i) in lessons" :key="item.id" class="lesson-link" :aria-current="item.id === selected && view === 'learn' ? 'step' : undefined" @click="choose(item.id)">
          <span class="w-4 shrink-0 font-mono text-xs" :class="isComplete(item.id) ? 'text-success' : ''" aria-hidden="true">{{ isComplete(item.id) ? '✓' : String(i + 1).padStart(2, '0') }}</span>
          <span>{{ item.title }}</span><span v-if="isComplete(item.id)" class="sr-only">Завершён</span>
        </button>
      </nav>
      <button class="mt-4 block w-full border-t border-line pt-3 text-left text-sm text-accent hover:underline" @click="showProgress">Мои результаты <span aria-hidden="true">→</span></button>
    </aside>
    <main id="main" class="min-w-0">
      <div v-if="storageError" role="alert" class="mb-5 rounded-md border border-accent p-3 text-sm text-accent">{{ storageError }}</div>
      <template v-if="view === 'learn'">
        <div class="mb-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted"><span>JavaScript с нуля <span class="mx-2 text-[#bbb4a9]">/</span> Урок {{ index + 1 }}</span><span>{{ lesson.minutes }} минут · Начальный уровень</span></div>
        <header :key="lesson.id" class="enter"><h1 ref="lessonHeading" tabindex="-1" class="page-title">{{ lesson.title }}</h1><p class="mt-4 max-w-xl text-[15px] leading-7 text-muted">{{ lesson.description }}</p></header>
        <div ref="lessonTabs" class="lesson-tabs mt-6" role="group" aria-label="Раздел урока">
          <button :aria-pressed="tab === 'theory'" @click="tab = 'theory'">Теория и практика</button>
          <button :aria-pressed="tab === 'task'" @click="tab = 'task'">Задача <span v-if="answers[`${lesson.id}:code`]?.passed" class="text-success">✓</span></button>
        </div>
        <div v-if="tab === 'theory'" :key="lesson.id + '-theory'" class="enter">
          <article v-for="(section, i) in lesson.theory" :key="`${lesson.id}:${i}`" class="border-b border-line py-8 last:border-0">
            <h2 class="text-xl font-medium tracking-[-.3px]">{{ section.title }}</h2><p class="mt-4 text-[15px] leading-[1.85] text-muted">{{ section.text }}</p>
            <div class="mt-5 overflow-hidden rounded-lg border border-line bg-soft"><div class="flex justify-between border-b border-line px-4 py-2.5 text-[11px] text-muted"><span>Пример</span><span class="font-mono">JavaScript</span></div><pre class="overflow-x-auto p-5 font-mono text-[13px] leading-7 text-[#544b40]"><code>{{ section.example }}</code></pre></div>
            <QuickPractice v-if="ready" :input-id="`${lesson.id}-${section.practice.id}`" :exercise="section.practice" :answer="answers[`${lesson.id}:${section.practice.id}`]" @save="(value, passed, feedback) => save(`${lesson.id}:${section.practice.id}`, value, passed, feedback)" />
          </article>
          <div class="mt-2 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6"><span class="text-xs text-muted">Теперь применим знания самостоятельно</span><button class="button-primary" @click="openTask">Перейти к задаче <span aria-hidden="true">→</span></button></div>
        </div>
        <div v-else :key="lesson.id + '-task'" class="enter">
          <CodeTask v-if="ready" :key="lesson.id" :task="lesson.task" :answer="answers[`${lesson.id}:code`]" :input-id="`${lesson.id}-code`" @save="(value, passed, feedback) => save(`${lesson.id}:code`, value, passed, feedback)" />
          <div class="mt-8 border-t border-line pt-6"><p v-if="isComplete(lesson.id)" role="status" class="mb-4 text-sm text-success">Урок завершён: практика с кодом и задача приняты.</p><p v-else class="mb-4 text-xs leading-6 text-muted">Для завершения урока дайте верные ответы в практике с кодом и пройдите все тесты задачи.</p><button v-if="index < lessons.length - 1" class="button-secondary" @click="choose(lessons[index + 1]!.id)">Следующий урок →</button><button v-else class="button-secondary" @click="showProgress">Посмотреть результаты →</button></div>
        </div>
      </template>
      <template v-else>
        <p class="mb-6 text-xs text-muted">JavaScript с нуля</p><h1 ref="lessonHeading" tabindex="-1" class="page-title enter">Мои результаты</h1><p class="mt-4 text-[15px] leading-7 text-muted">{{ completed === lessons.length ? 'Вы прошли базовую программу JavaScript. Возвращайтесь к задачам, чтобы закрепить знания.' : 'Здесь собраны ваши результаты. Продолжайте с любого урока.' }}</p>
        <div class="my-9 grid grid-cols-3 border-y border-line py-6"><div><div class="text-3xl">{{ completed }}<span class="text-base text-muted"> / {{ lessons.length }}</span></div><p class="mt-2 text-xs text-muted">Уроков пройдено</p></div><div><div class="text-3xl">{{ solved }}<span class="text-base text-muted"> / {{ totalExercises }}</span></div><p class="mt-2 text-xs text-muted">Ответов принято</p></div><div><div class="text-3xl text-accent">{{ percent }}%</div><p class="mt-2 text-xs text-muted">Программа освоена</p></div></div>
        <h2 class="mb-4 text-lg">Ваши уроки</h2><div v-for="(item, i) in lessons" :key="item.id" class="flex items-center gap-4 border-b border-line py-5"><span class="font-mono text-xs text-muted">{{ String(i + 1).padStart(2, '0') }}</span><div class="flex-1"><p class="text-sm">{{ item.title }}</p><p class="mt-1 text-xs" :class="isComplete(item.id) ? 'text-success' : 'text-muted'">{{ isComplete(item.id) ? 'Завершён' : Object.keys(answers).some(k => k.startsWith(item.id + ':')) ? 'В процессе' : 'Ещё не начат' }}</p></div><button class="text-sm text-accent" :aria-label="`Открыть урок: ${item.title}`" @click="choose(item.id)">Открыть →</button></div>
      </template>
      <details class="mt-8 border-t border-line pt-4 text-sm text-muted">
        <summary class="w-fit cursor-pointer text-ink">Как проверяются и сохраняются ответы</summary>
        <p class="mt-3 max-w-prose leading-6">Проверка учитывает значение и тип результата, включая граничные случаи. Черновики и результаты хранятся в этом браузере.</p>
      </details>
    </main>
  </div>
</template>
