<script setup lang="ts">
import type { Lesson, Answer } from '../../shared/types/course'
import { checkCode, type TestResult } from '~/utils/checkCode'
const props = defineProps<{ task: Lesson['task']; answer?: Answer; inputId: string }>()
const emit = defineEmits<{ save: [value: string, passed: boolean, feedback: string] }>()
const running = ref(false)
const results = ref<TestResult[]>([])
const code = computed(() => props.answer?.value ?? props.task.starter)
let revision = 0
// Не принимаем результат старого запуска после изменения кода или ухода из задачи.
onBeforeUnmount(() => { revision++ })
function edit(value: string) { revision++; results.value = []; emit('save', value, false, '') }
async function run() {
  if (running.value || !code.value.trim()) return
  const current = revision
  const submitted = code.value
  running.value = true
  const output = await checkCode(submitted, props.task.functionName, props.task.cases)
  running.value = false
  if (current !== revision) return
  results.value = output
  const passed = output.length === props.task.cases.length && output.every(r => r.passed)
  emit('save', submitted, passed, passed ? 'Все тесты пройдены. Задача решена.' : 'Есть ошибки. Исправьте код и запустите проверку ещё раз.')
}
</script>

<template>
  <section class="mt-8 border-t border-line pt-8" @keydown.ctrl.enter.prevent="run">
    <div class="mb-3 flex items-center justify-between"><span class="text-xs font-semibold uppercase tracking-widest text-accent">Самостоятельная задача</span><span class="text-xs text-muted">{{ task.cases.length }} теста</span></div>
    <h2 class="text-xl font-medium">{{ task.title }}</h2>
    <p class="mt-3 text-sm leading-7 text-muted">{{ task.prompt }}</p>
    <aside v-if="task.example" class="my-6 rounded-lg border border-line bg-soft p-5 sm:p-6">
      <h3 class="text-base font-medium">{{ task.example.title }}</h3>
      <p class="mt-3 text-sm leading-7 text-muted">{{ task.example.description }}</p>
      <pre class="my-4 overflow-x-auto rounded-md border border-line bg-paper p-4 text-[13px] leading-7"><code>{{ task.example.code }}</code></pre>
      <p class="mb-3 text-xs font-medium uppercase tracking-wider text-accent">Как это работает</p>
      <ol class="list-decimal space-y-2 pl-5 text-sm leading-7 text-muted"><li v-for="step in task.example.steps" :key="step">{{ step }}</li></ol>
      <p class="mt-4 border-t border-line pt-4 text-sm leading-7"><strong class="font-medium">Теперь ваша очередь.</strong> {{ task.example.transfer }}</p>
    </aside>
    <details class="my-4 text-xs text-muted"><summary class="cursor-pointer">Примеры входа и результата</summary><ul class="mt-2 space-y-2 font-mono"><li v-for="(test, index) in task.cases" :key="index" class="break-all">{{ task.functionName }}({{ test.args.map(a => JSON.stringify(a)).join(', ') }}) → {{ JSON.stringify(test.expected) }}</li></ul></details>
    <div class="overflow-hidden rounded-lg border border-line">
      <div class="flex justify-between border-b border-line bg-soft px-4 py-3 text-xs text-muted"><label :for="inputId">Ваш код</label><span class="font-mono">JavaScript · solution.js</span></div>
      <ClientOnly><CodeEditor :model-value="code" @update:model-value="edit" @run="run" /></ClientOnly>
    </div>
    <p class="mt-2 text-xs text-muted">Tab — отступ. Ctrl + Enter — проверить. Код должен возвращать результат через return.</p>
    <div class="mt-5 flex flex-wrap items-center gap-4"><button class="button-primary" :disabled="running || !code.trim()" @click="run">{{ running ? 'Проверяем…' : 'Проверить решение' }} <span aria-hidden="true">→</span></button></div>
    <div aria-live="polite"><p v-if="answer?.feedback" class="mt-5 text-sm font-medium" :class="answer.passed ? 'text-success' : 'text-accent'">{{ answer.feedback }}</p><ul v-if="results.length" class="mt-3 space-y-2 rounded-md bg-soft p-4 text-xs"><li v-for="(result, index) in results" :key="index" class="break-words" :class="result.passed ? 'text-success' : 'text-accent'">{{ result.passed ? '✓' : '×' }} {{ result.label }}</li></ul></div>
  </section>
</template>

