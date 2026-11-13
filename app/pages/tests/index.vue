<script setup lang="ts">
import { resultOf } from '#shared/utils/platform'
import type { TestDefinition, Submission } from '../../../shared/types/platform'

const { user, staff } = useAuth()
const { data: tests, error: loadError, refresh: reloadTests } = await useFetch<TestDefinition[]>('/api/platform/tests', { query: { audience: 'student' } })
const { data: submissions, error: historyError, refresh } = await useFetch<Submission[]>('/api/platform/submissions', { immediate: !staff.value })
usePlatformSync(() => Promise.all([reloadTests(), staff.value ? undefined : refresh()]))

const route = useRoute()
const router = useRouter()
const active = ref<TestDefinition | null>(null)
const values = ref<Record<string, string>>({})
const error = ref('')
const notice = ref('')
const draftError = ref('')
const busy = ref(false)
const title = ref<HTMLElement>()
const historyTitle = ref<HTMLElement>()
const pointPlural = new Intl.PluralRules('ru')
const pointForms: Partial<Record<Intl.LDMLPluralRule, string>> = { one: 'балл', few: 'балла' }
const latest = computed(() => tests.value?.find(test => test.id === active.value?.id))
const changed = computed(() => Boolean(active.value && !loadError.value && (!latest.value || (latest.value.version || latest.value.updatedAt) !== (active.value.version || active.value.updatedAt))))
const answered = computed(() => active.value?.questions.filter(q => values.value[q.id]?.trim()).length ?? 0)
const attempts = computed(() => (submissions.value || []).slice().sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).map(submission => {
  const result = resultOf(submission)
  return { submission, result, status: attemptStatus(result) }
}))
const latestAttempts = computed(() => {
  const byTest = new Map<string, (typeof attempts.value)[number]>()
  for (const attempt of attempts.value) {
    if (!byTest.has(attempt.submission.testId)) byTest.set(attempt.submission.testId, attempt)
  }
  return byTest
})

function focusTitle() {
  nextTick(() => title.value?.focus())
}
function closeTest(focus = true) {
  active.value = null
  if (route.query.id) {
    const { id, ...query } = route.query
    void router.replace({ query })
  }
  if (focus) focusTitle()
}
function updateActive() {
  if (!latest.value) {
    closeTest()
    return
  }
  const previous = active.value
  const nextValues: Record<string, string> = {}
  for (const question of latest.value.questions) {
    const old = previous?.questions.find(q => q.id === question.id)
    if (old?.type === question.type && old.prompt === question.prompt && values.value[question.id] !== undefined) {
      nextValues[question.id] = values.value[question.id]!
    }
  }
  active.value = structuredClone(toRaw(latest.value))
  values.value = nextValues
  error.value = ''
  focusTitle()
}

const storageKey = (id: string) => 'practice:test:' + user.value?.id + ':' + id
function open(test: TestDefinition, focus = true) {
  active.value = test
  values.value = {}
  error.value = ''
  notice.value = ''
  draftError.value = ''
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(test.id)) || 'null')
    if (saved?.version === (test.version || test.updatedAt) && saved.answers && typeof saved.answers === 'object') {
      for (const question of test.questions) {
        if (typeof saved.answers[question.id] === 'string') values.value[question.id] = saved.answers[question.id]
      }
    }
  } catch { /* A missing draft does not prevent taking the test. */ }
  if (focus) focusTitle()
}
function openLinkedTest() {
  const test = tests.value?.find(item => item.id === route.query.id)
  if (test && active.value?.id !== test.id) open(test, false)
}
onMounted(openLinkedTest)
watch(() => route.query.id, openLinkedTest)
watch(values, () => {
  if (!active.value || staff.value) return
  try {
    localStorage.setItem(storageKey(active.value.id), JSON.stringify({ version: active.value.version || active.value.updatedAt, answers: values.value }))
    draftError.value = ''
  } catch {
    draftError.value = 'Браузер не сохранил черновик. Отправьте ответы до закрытия вкладки.'
  }
}, { deep: true })

function goToQuestion(index: number) {
  document.getElementById('question-' + index)?.focus()
}
async function submit() {
  const test = active.value
  if (!test || busy.value || changed.value || user.value?.role !== 'student' || answered.value !== test.questions.length) return
  busy.value = true
  error.value = ''
  try {
    const submission = await $fetch<Submission>('/api/platform/submissions', { method: 'POST', body: { testId: test.id, version: test.version || test.updatedAt, answers: values.value } })
    try { localStorage.removeItem(storageKey(test.id)) } catch { /* The submission is already saved on the server. */ }
    submissions.value = [...(submissions.value || []).filter(item => item.id !== submission.id), submission]
    closeTest(false)
    notice.value = 'Ответы отправлены. Результат появился в списке попыток.'
    await nextTick()
    historyTitle.value?.focus()
    await refresh()
  } catch (e) {
    if ((e as { statusCode?: number }).statusCode === 409) {
      await reloadTests()
      error.value = 'Преподаватель обновил тест. Откройте актуальную версию перед отправкой.'
    } else {
      error.value = platformError(e)
    }
  } finally {
    busy.value = false
  }
}
useHead({ title: computed(() => (active.value?.title || 'Тесты') + ' — практика') })
</script>

<template>
  <main class="workspace-page workspace-page-medium">
    <header class="desk-header enter">
      <div class="min-w-0">
        <button v-if="active" class="desk-text-button mb-2" :disabled="busy" @click="closeTest()">← К списку тестов</button>
        <p v-else class="eyebrow">{{ staff ? 'Просмотр для преподавателя' : 'Задания преподавателя' }}</p>
        <h1 ref="title" class="page-title" tabindex="-1">{{ active?.title || 'Тесты и задания' }}</h1>
        <p class="desk-lead">{{ active ? 'Порог прохождения — ' + active.passPercent + '%.' : staff ? 'Так опубликованные тесты видят студенты.' : 'Открывайте тесты и возвращайтесь к результатам своих попыток.' }}</p>
      </div>
      <NuxtLink v-if="!active" :to="staff ? '/admin?section=tests' : '/notes'" class="button-secondary">{{ staff ? 'К редактору тестов' : 'К конспектам' }} <span aria-hidden="true">→</span></NuxtLink>
    </header>

    <p v-if="loadError" role="alert" class="people-alert people-alert-error">Не удалось загрузить тесты. <button class="underline" @click="reloadTests()">Повторить</button></p>
    <p v-if="error" role="alert" class="people-alert people-alert-error">{{ error }}</p>
    <p v-if="notice" role="status" class="people-alert people-alert-success enter">{{ notice }}</p>

    <template v-if="active">
      <div v-if="changed" role="status" class="people-alert people-alert-error enter">
        <p>{{ latest ? 'Преподаватель обновил тест или связанный конспект.' : 'Тест снят с публикации.' }} Ваши введённые ответы сохранены в браузере.</p>
        <p v-if="latest" class="mt-1 text-sm">Ответы на неизменённые вопросы сохранятся.</p>
        <button class="button-secondary mt-3" @click="updateActive">{{ latest ? 'Открыть актуальную версию' : 'К списку тестов' }}</button>
      </div>
      <p v-if="draftError" role="alert" class="people-alert people-alert-error">{{ draftError }}</p>
      <div class="test-layout">
        <form class="desk-form test-questions" @submit.prevent="submit">
          <details v-if="active.notes" open class="desk-surface desk-details">
            <summary class="desk-row"><h2 class="desk-row-title">Конспект к тесту</h2></summary>
            <div class="desk-detail-body"><TestNotes :text="active.notes" /></div>
          </details>
          <section v-for="(q, index) in active.questions" :id="'question-' + index" :key="q.id" tabindex="-1" class="desk-surface test-question">
            <h2 :id="'label-' + q.id" class="desk-row-title">{{ index + 1 }}. {{ q.prompt }}</h2>
            <p class="desk-row-meta mb-4">{{ q.points }} {{ pointForms[pointPlural.select(q.points)] || 'баллов' }} · {{ ['free', 'code'].includes(q.type) ? 'Ручная оценка' : 'Автоматическая проверка' }}</p>
            <fieldset v-if="q.type === 'choice'" :aria-labelledby="'label-' + q.id" class="grid gap-2">
              <label v-for="option in q.options" :key="option" class="test-choice">
                <input v-model="values[q.id]" type="radio" :name="q.id" :value="option" required>{{ option }}
              </label>
            </fieldset>
            <ClientOnly v-else-if="['code', 'code_reference'].includes(q.type)">
              <div class="overflow-hidden rounded-lg border border-line"><CodeEditor :model-value="values[q.id] || ''" :label="q.prompt" @update:model-value="values[q.id] = $event" /></div>
            </ClientOnly>
            <textarea v-else-if="q.type === 'free'" v-model="values[q.id]" required maxlength="30000" rows="5" class="field" :aria-labelledby="'label-' + q.id" placeholder="Развёрнутый ответ своими словами" />
            <input v-else v-model="values[q.id]" required maxlength="30000" class="field" :aria-labelledby="'label-' + q.id" placeholder="Короткий ответ">
            <p v-if="q.type === 'code_reference'" class="mt-3 text-xs leading-6 text-muted">Код сравнивается с эталоном как текст. Пробелы по краям и тип переноса строк не учитываются; остальные символы должны совпасть.</p>
          </section>
          <div v-if="!staff" class="desk-form-actions border-t border-line">
            <button class="button-primary" :disabled="busy || changed || answered !== active.questions.length">{{ busy ? 'Отправляем…' : 'Отправить на проверку' }}</button>
            <p class="text-sm text-muted">{{ answered !== active.questions.length ? 'Ответьте на все вопросы, чтобы отправить тест.' : 'После отправки можно начать новую попытку.' }}</p>
          </div>
        </form>
        <aside class="desk-surface test-guide" aria-label="Навигация по вопросам">
          <p class="desk-row-title">Вопросы</p>
          <p class="mt-1 text-xs text-muted">{{ answered }} из {{ active.questions.length }} заполнено</p>
          <div class="progress-track mt-3" role="progressbar" aria-label="Заполненные ответы" :aria-valuenow="answered" :aria-valuemin="0" :aria-valuemax="active.questions.length">
            <span :style="{ transform: 'scaleX(' + (active.questions.length ? answered / active.questions.length : 0) + ')' }" />
          </div>
          <ol><li v-for="(q, index) in active.questions" :key="q.id"><button type="button" :data-filled="Boolean(values[q.id]?.trim())" :aria-label="'Вопрос ' + (index + 1) + (values[q.id]?.trim() ? ', заполнен' : ', без ответа')" @click="goToQuestion(index)">{{ index + 1 }}</button></li></ol>
          <p class="text-xs leading-5 text-muted">{{ staff ? 'Ответы в предпросмотре не отправляются.' : 'Черновик хранится в этом браузере.' }}</p>
        </aside>
      </div>
    </template>

    <template v-else>
      <section aria-labelledby="available-tests" class="desk-section">
        <header class="desk-section-heading">
          <h2 id="available-tests" class="desk-title">Доступные тесты</h2>
          <a v-if="!staff && attempts.length" href="#attempts" class="desk-text-button">Мои результаты ↓</a>
        </header>
        <div v-if="tests?.length" class="desk-surface desk-list">
          <article v-for="test in tests" :key="test.id" class="desk-row">
            <div class="min-w-0">
              <h3 class="desk-row-title">{{ test.title }}</h3>
              <div class="desk-row-meta">
                <span>Вопросов: {{ test.questions.length }} · порог {{ test.passPercent }}%</span>
                <span v-if="!staff && latestAttempts.get(test.id)" class="desk-chip" :data-tone="latestAttempts.get(test.id)?.status.tone">{{ latestAttempts.get(test.id)?.status.label }}</span>
              </div>
            </div>
            <button :class="staff ? 'button-secondary' : 'button-primary'" @click="open(test)">{{ staff ? 'Предпросмотр теста' : 'Открыть тест' }} <span class="action-arrow" aria-hidden="true">→</span></button>
          </article>
        </div>
        <div v-else-if="!loadError" class="desk-surface desk-empty">
          <h3>Опубликованных тестов пока нет</h3><p>{{ staff ? 'Опубликуйте тест в редакторе, чтобы он появился здесь.' : 'Здесь появятся задания, когда преподаватель их опубликует.' }}</p>
        </div>
      </section>
      <section v-if="!staff" class="desk-section" aria-labelledby="attempts">
        <header class="desk-section-heading"><h2 id="attempts" ref="historyTitle" tabindex="-1" class="desk-title">Ваши попытки</h2></header>
        <p v-if="historyError" role="alert" class="people-alert people-alert-error">Не удалось обновить попытки. <button class="underline" @click="refresh()">Повторить</button></p>
        <div v-if="attempts.length" class="desk-surface desk-list">
          <details v-for="{ submission, result, status } in attempts" :key="submission.id" class="desk-details">
            <summary class="desk-row">
              <span class="min-w-0"><strong class="desk-row-title">{{ submission.testTitle }}</strong><span class="desk-row-meta">{{ new Date(submission.submittedAt).toLocaleString('ru-RU') }}</span></span>
              <span class="desk-attempt-result"><span class="desk-score">{{ result.percent }}%</span><span class="desk-chip" :data-tone="status.tone">{{ status.label }}</span></span>
            </summary>
            <div class="desk-detail-body">
              <p v-if="result.pending" class="mb-3 text-sm text-muted">Процент предварительный. Он обновится после проверки.</p>
              <section v-for="answer in submission.answers" :key="answer.question.id" class="py-4 first:pt-0 [&+&]:border-t [&+&]:border-line">
                <h3 class="desk-row-title">{{ answer.question.prompt }}</h3>
                <pre class="my-3 whitespace-pre-wrap break-words rounded-lg bg-soft p-3 text-sm">{{ answer.value }}</pre>
                <p class="text-xs text-muted">Баллы: {{ answer.points ?? 'Ожидает оценки' }} / {{ answer.question.points }}</p>
                <p v-if="answer.comment" class="mt-2 rounded-lg bg-soft p-3 text-sm">Комментарий: {{ answer.comment }}</p>
              </section>
            </div>
          </details>
        </div>
        <div v-else-if="!historyError" class="desk-surface desk-empty"><h3>Попыток пока нет</h3><p>После отправки теста здесь появятся ответы, оценки и комментарии.</p></div>
      </section>
    </template>
  </main>
</template>
