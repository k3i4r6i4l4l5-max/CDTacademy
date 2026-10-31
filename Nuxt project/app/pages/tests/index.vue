<script setup lang="ts">
import { resultOf } from '#shared/utils/platform'
import type { TestDefinition, Submission } from '../../../shared/types/platform'
const { user } = useAuth()
const { data: tests, error: loadError, refresh: reloadTests } = await useFetch<TestDefinition[]>('/api/platform/tests', { query: { audience: 'student' } })
const { data: submissions, refresh } = await useFetch<Submission[]>('/api/platform/submissions')
usePlatformSync(() => Promise.all([reloadTests(), refresh()]))
const route = useRoute()
const active = ref<TestDefinition | null>(null)
const values = ref<Record<string, string>>({})
const error = ref(''), busy = ref(false)
const latest = computed(() => tests.value?.find(test => test.id === active.value?.id))
// Открытая версия отделена от обновляемого списка: правки преподавателя не затирают ответы.
const changed = computed(() => Boolean(active.value && !loadError.value && (!latest.value || (latest.value.version || latest.value.updatedAt) !== (active.value.version || active.value.updatedAt))))
function updateActive() {
  if (!latest.value) { active.value = null; return }
  const previous = active.value
  const nextValues: Record<string, string> = {}
  for (const question of latest.value.questions) {
    // Переносим ответ только при неизменном условии и типе вопроса.
    const old = previous?.questions.find(q => q.id === question.id)
    if (old?.type === question.type && old.prompt === question.prompt && values.value[question.id] !== undefined) nextValues[question.id] = values.value[question.id]!
  }
  active.value = structuredClone(toRaw(latest.value)); values.value = nextValues; error.value = ''
}
const storageKey = (id: string) => `practice:test:${user.value?.id}:${id}`
function open(test: TestDefinition) {
  active.value = test; values.value = {}; error.value = ''
  try { const saved = JSON.parse(localStorage.getItem(storageKey(test.id)) || 'null'); if (saved?.version === (test.version || test.updatedAt)) values.value = saved.answers } catch { /* An unavailable draft does not prevent taking a test. */ }
}
onMounted(() => { const test = tests.value?.find(t => t.id === route.query.id); if (test) open(test) })
watch(values, () => {
  if (!active.value) return
  try { localStorage.setItem(storageKey(active.value.id), JSON.stringify({ version: active.value.version || active.value.updatedAt, answers: values.value })) } catch { error.value = 'Черновик не сохраняется в браузере. Отправьте ответы до закрытия вкладки.' }
}, { deep: true })
async function submit() {
  if (!active.value || busy.value || changed.value || user.value?.role !== 'student') return
  busy.value = true; error.value = ''
  try {
    await $fetch('/api/platform/submissions', { method: 'POST', body: { testId: active.value.id, version: active.value.version || active.value.updatedAt, answers: values.value } })
    localStorage.removeItem(storageKey(active.value.id)); active.value = null; await refresh()
  } catch (e) {
    if ((e as { statusCode?: number }).statusCode === 409) { await reloadTests(); error.value = 'Преподаватель обновил тест. Откройте актуальную версию перед отправкой.' }
    else error.value = platformError(e)
  } finally { busy.value = false }
}
useHead({ title: 'Тесты — практика' })
</script>
<template>
  <main class="mx-auto max-w-5xl px-5 py-10 sm:py-14"><NuxtLink to="/" class="text-sm text-muted">← Главная</NuxtLink><h1 class="page-title mt-6">Тесты и задания</h1><p class="mt-4 text-sm text-muted">Конспект, практика и ваши результаты в одном месте.</p><p v-if="loadError" role="alert" class="mt-5 text-accent">Не удалось загрузить тесты. Обновите страницу.</p>
    <NuxtLink to="/notes" class="button-secondary mt-5">Библиотека конспектов →</NuxtLink>
    <p v-if="error" role="alert" class="my-5 text-sm text-accent">{{ error }}</p>
    <p v-if="user?.role !== 'student'" class="mt-4 text-sm text-muted">Предпросмотр: опубликованное содержимое отображается студенту в таком же виде.</p>
    <section v-if="active" class="panel mt-8"><div v-if="changed" role="status" class="people-alert people-alert-error"><p>{{ latest ? 'Преподаватель обновил тест или связанный конспект.' : 'Тест снят с публикации.' }} Ваши введённые ответы сохранены в браузере.</p><button class="button-secondary mt-3" @click="updateActive">{{ latest ? 'Открыть актуальную версию' : 'К списку тестов' }}</button><p v-if="latest" class="mt-2 text-xs">Ответы на неизменённые вопросы сохранятся.</p></div><button class="text-sm text-muted" @click="active = null">← К списку тестов</button><h2 class="mt-5 text-2xl">{{ active.title }}</h2><p class="my-3 text-xs text-muted">Порог прохождения: {{ active.passPercent }}%. Все вопросы обязательны.</p><div v-if="active.notes" class="my-7 border-y border-line py-6"><h3 class="mb-4 text-base font-medium">Конспект</h3><TestNotes :text="active.notes" /></div>
      <form class="space-y-7" @submit.prevent="submit"><section v-for="(q, index) in active.questions" :key="q.id" class="border-b border-line pb-7"><h3 :id="`label-${q.id}`" class="mb-3 text-base">{{ index + 1 }}. {{ q.prompt }}</h3><p class="mb-3 text-xs text-muted">{{ q.points }} балл(ов) · {{ ['free', 'code'].includes(q.type) ? 'Ручная оценка преподавателем' : 'Автоматическая проверка' }}</p>
        <fieldset v-if="q.type === 'choice'" :aria-labelledby="`label-${q.id}`" class="space-y-3"><label v-for="option in q.options" :key="option" class="flex items-center gap-3 text-sm"><input v-model="values[q.id]" type="radio" :name="q.id" :value="option" required>{{ option }}</label></fieldset>
        <ClientOnly v-else-if="['code', 'code_reference'].includes(q.type)"><div class="overflow-hidden rounded-lg border border-line"><CodeEditor :model-value="values[q.id] || ''" :label="q.prompt" @update:model-value="values[q.id] = $event" /></div></ClientOnly>
        <textarea v-else-if="q.type === 'free'" v-model="values[q.id]" required maxlength="30000" rows="6" class="field" :aria-labelledby="`label-${q.id}`" placeholder="Развёрнутый ответ своими словами" />
        <input v-else v-model="values[q.id]" required maxlength="30000" class="field" :aria-labelledby="`label-${q.id}`" placeholder="Короткий ответ">
        <p v-if="q.type === 'code_reference'" class="mt-3 text-xs leading-6 text-muted">Код сравнивается с эталоном как текст. Пробелы по краям и тип переноса строк не учитываются; остальные символы должны совпасть.</p>
      </section><button v-if="user?.role === 'student'" class="button-primary" :disabled="busy || changed || active.questions.some(q => !values[q.id]?.trim())">{{ busy ? 'Отправляем…' : 'Отправить на проверку' }}</button><p class="text-xs text-muted">После отправки ответы не редактируются. Можно пройти тест ещё раз отдельной попыткой.</p></form>
    </section>
    <template v-else><div class="mt-8 grid gap-4 sm:grid-cols-2"><article v-for="test in tests" :key="test.id" class="panel"><h2 class="text-xl">{{ test.title }}</h2><p class="my-4 text-sm text-muted">{{ test.questions.length }} вопросов · проходной порог {{ test.passPercent }}%</p><button v-if="user?.role === 'student'" class="button-primary" @click="open(test)">Открыть тест →</button><button v-else class="button-secondary" @click="open(test)">Предпросмотр теста →</button></article></div><p v-if="!tests?.length && !loadError" class="mt-8 text-muted">Опубликованных тестов пока нет.</p>
      <h2 class="mt-12 mb-5 text-xl">Ваши попытки</h2><p v-if="!submissions?.length" class="text-sm text-muted">После отправки здесь появятся ответы, оценки и комментарии.</p><details v-for="s in submissions" :key="s.id" class="panel mb-4"><summary class="cursor-pointer text-sm"><span class="font-medium">{{ s.testTitle }}</span> · {{ new Date(s.submittedAt).toLocaleString('ru-RU') }} · {{ resultOf(s).percent }}% · {{ resultOf(s).pending ? 'Ожидает проверки (процент предварительный)' : resultOf(s).passed ? 'Пройден' : 'Не пройден' }}</summary><div v-for="a in s.answers" :key="a.question.id" class="mt-5 border-t border-line pt-4"><h3 class="text-sm font-medium">{{ a.question.prompt }}</h3><pre class="my-3 whitespace-pre-wrap break-words rounded-md bg-soft p-3 text-sm">{{ a.value }}</pre><p class="text-xs text-muted">Баллы: {{ a.points ?? 'Ожидает оценки' }} / {{ a.question.points }}</p><p v-if="a.comment" class="mt-2 text-sm text-accent">Комментарий: {{ a.comment }}</p></div></details>
    </template>
  </main>
</template>
