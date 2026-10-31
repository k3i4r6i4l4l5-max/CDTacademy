<script setup lang="ts">
import type { Exercise, Answer } from '../../shared/types/course'
import { checkCode } from '~/utils/checkCode'
const props = defineProps<{ exercise: Exercise; answer?: Answer; inputId: string }>()
const emit = defineEmits<{ save: [value: string, passed: boolean, feedback: string] }>()
const hint = ref(false)
const running = ref(false)
const code = computed(() => props.answer?.value ?? props.exercise.starter ?? 'function solution() {\n  \n}')
let revision = 0
// Изменение кода делает результат предыдущего запуска неактуальным.
onBeforeUnmount(() => { revision++ })
function edit(value: string) { revision++; emit('save', value, false, '') }
async function check() {
  if (running.value) return
  const current = revision
  const value = code.value
  running.value = true
  const results = await checkCode(value, 'solution', [{ args: [], expected: props.exercise.expected }])
  running.value = false
  if (current !== revision) return
  const passed = results.every(r => r.passed)
  emit('save', value, passed, passed ? 'Верно. Код возвращает ожидаемый результат.' : results.map(r => r.label).join('\n'))
}
</script>

<template>
  <div class="mt-6 rounded-lg border border-line bg-paper p-5">
    <div class="mb-3 flex items-center justify-between gap-3 text-xs"><span class="font-semibold uppercase tracking-widest text-accent">Закрепим</span><span class="text-muted">Практика с кодом</span></div>
    <p class="mb-3 text-sm leading-relaxed">{{ exercise.prompt }}</p>
    <div :id="inputId" class="overflow-hidden rounded-md border border-line"><ClientOnly><CodeEditor :model-value="code" :label="`Код практики ${inputId}`" @update:model-value="edit" @run="check" /></ClientOnly></div>
    <button class="button-secondary mt-4" :disabled="running || !code.trim()" @click="check">{{ running ? 'Проверяем…' : 'Проверить код' }}</button>
    <p v-if="answer?.feedback" role="status" class="mt-3 text-sm" :class="answer.passed ? 'text-success' : 'text-accent'">{{ answer.feedback }}</p>
    <button type="button" class="mt-3 text-xs text-muted underline decoration-line underline-offset-4" @click="hint = !hint">{{ hint ? 'Скрыть подсказку' : 'Нужна подсказка?' }}</button>
    <p v-if="hint" class="mt-2 text-sm text-muted">{{ exercise.hint }}</p>
  </div>
</template>
