<script setup lang="ts">
import { lessons } from '~/data/course'
useHead({ title: 'JavaScript с нуля — практика', htmlAttrs: { lang: 'ru' }, meta: [{ name: 'description', content: 'Теория JavaScript, практика и задачи с проверкой кода.' }] })
const { answers, selected, ready, storageError, completed, solved, isComplete, save } = useLearning()
const view = ref<'learn' | 'progress'>('learn')
const tab = ref<'theory' | 'task'>('theory')
const mobileMenu = ref(false)
const index = computed(() => Math.max(0, lessons.findIndex(l => l.id === selected.value)))
const lesson = computed(() => lessons[index.value]!)
const percent = computed(() => Math.round(completed.value / lessons.length * 100))
const totalExercises = lessons.reduce((sum, item) => sum + item.theory.length + 1, 0)
function choose(id: string) {
  selected.value = id; view.value = 'learn'; tab.value = 'theory'; mobileMenu.value = false
  nextTick(() => window.scrollTo({ top: 0, behavior: 'instant' }))
}
</script>

<template>
  <div class="min-h-dvh">
    <a class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-4" href="#main">К содержимому</a>

    <div class="learning-shell">
      <aside class="learning-program">
        <div class="flex items-center gap-3"><img src="/images/javascript.svg" alt="JavaScript" class="size-10 shrink-0 rounded-md"><div><div class="text-sm font-medium">JavaScript с нуля</div><div class="mt-1 text-xs text-muted">Базовая программа</div></div><button class="button-secondary ml-auto lg:hidden" :aria-expanded="mobileMenu" aria-controls="lesson-list" @click="mobileMenu = !mobileMenu">Уроки {{ mobileMenu ? '−' : '+' }}</button></div>
        <div class="mt-6 hidden lg:block"><div class="mb-2 flex justify-between text-xs text-muted"><span>{{ completed }} из {{ lessons.length }} уроков</span><span>{{ percent }}%</span></div><div class="h-1 overflow-hidden rounded-full bg-line" role="progressbar" :aria-valuenow="percent" :aria-valuemin="0" :aria-valuemax="100" aria-label="Прогресс курса"><div class="h-full bg-accent transition-all" :style="{ width: percent + '%' }" /></div></div>
        <nav id="lesson-list" class="mt-7 lg:block" :class="mobileMenu ? 'block' : 'hidden'" aria-label="Программа JavaScript"><p class="mb-3 text-[10px] font-semibold uppercase tracking-[.15em] text-muted">Содержание</p><button v-for="(item, i) in lessons" :key="item.id" class="mb-1 flex w-full items-start gap-3 rounded-md px-3 py-3 text-left text-[13px] leading-5 transition-colors" :class="item.id === selected && view === 'learn' ? 'bg-[#eee7dd] text-accent' : 'text-muted hover:bg-soft hover:text-ink'" :aria-current="item.id === selected && view === 'learn' ? 'step' : undefined" @click="choose(item.id)"><span class="w-4 shrink-0 font-mono text-xs" :class="isComplete(item.id) ? 'text-success' : ''">{{ isComplete(item.id) ? '✓' : String(i + 1).padStart(2, '0') }}</span><span>{{ item.title }}</span><span v-if="isComplete(item.id)" class="sr-only">Завершён</span></button></nav>
        <p class="mt-9 hidden border-t border-line pt-5 text-xs leading-6 text-muted lg:block">Учитесь в своём темпе.<br>К урокам можно возвращаться<br>в любой момент.</p>
      </aside>
      <main id="main" class="min-w-0 px-5 py-8 sm:px-10 sm:py-11">
        <div v-if="storageError" role="alert" class="mb-5 rounded-md border border-accent p-3 text-sm text-accent">{{ storageError }}</div>
        <template v-if="view === 'learn'">
          <div class="mb-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted"><span>JavaScript с нуля <span class="mx-2 text-[#bbb4a9]">/</span> Урок {{ index + 1 }}</span><span>{{ lesson.minutes }} минут · Начальный уровень</span></div>
          <h1 class="page-title">{{ lesson.title }}</h1><p class="mt-4 max-w-xl text-[15px] leading-7 text-muted">{{ lesson.description }}</p>
          <div class="mt-8 flex gap-7 border-b border-line text-sm" aria-label="Раздел урока"><button class="border-b-2 pb-3" :aria-pressed="tab === 'theory'" :class="tab === 'theory' ? 'border-accent text-accent' : 'border-transparent text-muted'" @click="tab = 'theory'">Теория и практика</button><button class="border-b-2 pb-3" :aria-pressed="tab === 'task'" :class="tab === 'task' ? 'border-accent text-accent' : 'border-transparent text-muted'" @click="tab = 'task'">Задача <span v-if="answers[`${lesson.id}:code`]?.passed" class="text-success">✓</span></button></div>
          <div v-if="tab === 'theory'">
            <article v-for="(section, i) in lesson.theory" :key="`${lesson.id}:${i}`" class="border-b border-line py-8 last:border-0">
              <h2 class="text-xl font-medium tracking-[-.3px]">{{ section.title }}</h2><p class="mt-4 text-[15px] leading-[1.85] text-muted">{{ section.text }}</p>
              <div class="mt-5 overflow-hidden rounded-lg border border-line bg-soft"><div class="flex justify-between border-b border-line px-4 py-2.5 text-[11px] text-muted"><span>Пример</span><span class="font-mono">JavaScript</span></div><pre class="overflow-x-auto p-5 font-mono text-[13px] leading-7 text-[#544b40]"><code>{{ section.example }}</code></pre></div>
              <QuickPractice v-if="ready" :input-id="`${lesson.id}-${section.practice.id}`" :exercise="section.practice" :answer="answers[`${lesson.id}:${section.practice.id}`]" @save="(value, passed, feedback) => save(`${lesson.id}:${section.practice.id}`, value, passed, feedback)" />
            </article>
            <div class="mt-2 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6"><span class="text-xs text-muted">Теперь применим знания самостоятельно</span><button class="button-primary" @click="tab = 'task'">Перейти к задаче <span aria-hidden="true">→</span></button></div>
          </div>
          <div v-else>
            <CodeTask v-if="ready" :key="lesson.id" :task="lesson.task" :answer="answers[`${lesson.id}:code`]" :input-id="`${lesson.id}-code`" @save="(value, passed, feedback) => save(`${lesson.id}:code`, value, passed, feedback)" />
            <div class="mt-8 border-t border-line pt-6"><p v-if="isComplete(lesson.id)" role="status" class="mb-4 text-sm text-success">Урок завершён: практика с кодом и задача приняты.</p><p v-else class="mb-4 text-xs leading-6 text-muted">Для завершения урока дайте верные ответы в практике с кодом и пройдите все тесты задачи.</p><button v-if="index < lessons.length - 1" class="button-secondary" @click="choose(lessons[index + 1]!.id)">Следующий урок →</button><button v-else class="button-secondary" @click="view = 'progress'">Посмотреть результаты →</button></div>
          </div>
        </template>
        <template v-else>
          <p class="mb-6 text-xs text-muted">JavaScript с нуля / Личный прогресс</p><h1 class="page-title">Каждый шаг считается.</h1><p class="mt-4 text-[15px] leading-7 text-muted">{{ completed === lessons.length ? 'Вы прошли базовую программу JavaScript. Возвращайтесь к задачам, чтобы закрепить знания.' : 'Здесь собраны ваши результаты. Продолжайте с любого урока.' }}</p>
          <div class="my-9 grid grid-cols-3 border-y border-line py-6"><div><div class="text-3xl">{{ completed }}<span class="text-base text-muted"> / {{ lessons.length }}</span></div><p class="mt-2 text-xs text-muted">Уроков пройдено</p></div><div><div class="text-3xl">{{ solved }}<span class="text-base text-muted"> / {{ totalExercises }}</span></div><p class="mt-2 text-xs text-muted">Ответов принято</p></div><div><div class="text-3xl text-accent">{{ percent }}%</div><p class="mt-2 text-xs text-muted">Программа освоена</p></div></div>
          <h2 class="mb-4 text-lg">Ваши уроки</h2><div v-for="(item, i) in lessons" :key="item.id" class="flex items-center gap-4 border-b border-line py-5"><span class="font-mono text-xs text-muted">{{ String(i + 1).padStart(2, '0') }}</span><div class="flex-1"><p class="text-sm">{{ item.title }}</p><p class="mt-1 text-xs" :class="isComplete(item.id) ? 'text-success' : 'text-muted'">{{ isComplete(item.id) ? 'Завершён' : Object.keys(answers).some(k => k.startsWith(item.id + ':')) ? 'В процессе' : 'Ещё не начат' }}</p></div><button class="text-sm text-accent" :aria-label="`Открыть урок: ${item.title}`" @click="choose(item.id)">Открыть →</button></div>
        </template>
      </main>
      <aside class="learning-summary"><div class="sticky top-8"><p class="text-xs font-medium">Ваш учебный ритм</p><div class="mt-5 flex items-baseline gap-2"><span class="text-[40px] font-normal tracking-tight">{{ percent }}<span class="text-xl">%</span></span><span class="text-xs text-muted">программы</span></div><div class="mt-3 h-1 rounded-full bg-line"><div class="h-full rounded-full bg-accent transition-all" :style="{ width: percent + '%' }" /></div><p class="mt-3 text-xs leading-6 text-muted">{{ completed }} из {{ lessons.length }} уроков завершено.<br>Впереди — новая практика.</p>
        <div class="mt-8 border-t border-line pt-6"><h2 class="text-sm font-medium">Как принимается ответ</h2><ol class="mt-4 list-inside list-decimal space-y-4 text-xs leading-6 text-muted"><li>Практика выполняется в редакторе JavaScript. Функция должна вернуть ожидаемый результат.</li><li>Код проверяется на нескольких примерах, включая граничные случаи.</li><li>Важны результат и его тип. Строка «5» и число 5 — разные ответы.</li></ol></div>
        <div class="mt-8 rounded-lg bg-soft p-4"><p class="text-xs font-medium">Ответы остаются у вас</p><p class="mt-2 text-xs leading-6 text-muted">Черновики и результаты сохраняются в этом браузере. После перезагрузки можно продолжить. Очистка данных сайта удалит ответы.</p></div>
      </div></aside>
    </div>
    <footer class="flex flex-wrap justify-between gap-2 border-t border-line px-5 py-6 text-xs text-muted sm:px-9"><span class="font-medium text-ink">практика</span><span>Учиться. Пробовать. Понимать.</span><span>JavaScript · {{ lessons.length }} уроков · {{ totalExercises }} заданий</span></footer>
  </div>
</template>
