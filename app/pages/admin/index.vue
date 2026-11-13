<script setup lang="ts">
import { resultOf } from '#shared/utils/platform'
import type { TestDefinition, Submission, PublicUser, QuestionType, NoteDefinition } from '../../../shared/types/platform'
const { data: tests, error: testsError, refresh: reloadTests } = await useFetch<TestDefinition[]>('/api/platform/tests')
const { data: submissions, error: submissionsError, refresh: reloadSubmissions } = await useFetch<Submission[]>('/api/platform/submissions')
const { data: students, refresh: reloadStudents } = await useFetch<PublicUser[]>('/api/platform/students')
const { data: library, refresh: reloadLibrary } = await useFetch<NoteDefinition[]>('/api/platform/notes')
const { user } = useAuth()
usePlatformSync(() => Promise.all([reloadTests(), reloadSubmissions(), reloadLibrary(), reloadStudents()]))
const route = useRoute()
const router = useRouter()
const isAdmin = computed(() => user.value?.role === 'admin')
const sections = [
  { id: 'overview', label: 'Обзор' },
  { id: 'tests', label: 'Редактор тестов' },
  { id: 'answers', label: 'Ответы и результаты' },
  { id: 'notes', label: 'Конспекты' },
  { id: 'people', label: 'Студенты и группы' },
  { id: 'analytics', label: 'Общая аналитика' },
] as const
type Section = typeof sections[number]['id']
const visibleSections = computed(() => sections.filter(section => section.id !== 'analytics' || isAdmin.value))
const tab = computed(() => visibleSections.value.find(section => section.id === route.query.section)?.id ?? 'overview')
const draft = ref<TestDefinition | null>(null)
// Редактируем копию теста: фоновая синхронизация не заменяет текущие правки формы.
watch(() => library.value?.find(note => note.id === draft.value?.noteId)?.body, body => {
  if (draft.value?.noteId && body !== undefined) draft.value.notes = body
})
const error = ref(''), success = ref(''), busy = ref(false)
const importingNote = ref(false)
const filterTest = ref(''), filterStudent = ref(''), maxPercent = ref<number | ''>(''), status = ref('all')
const testStatus = ref('all')
const testQuery = ref('')
const editorTitle = ref<HTMLElement>()
watch(tab, section => {
  if (section === 'tests' && draft.value) nextTick(() => editorTitle.value?.focus())
})
const grades = ref<Record<string, { points: number; comment: string }>>({})
const attempts = computed(() => (submissions.value || []).map(submission => {
  const result = resultOf(submission)
  return { submission, result, state: attemptStatus(result) }
}).sort((a, b) => Number(b.result.pending) - Number(a.result.pending) || b.submission.submittedAt.localeCompare(a.submission.submittedAt)))
const pending = computed(() => attempts.value.filter(item => item.result.pending).length)
const published = computed(() => (tests.value || []).filter(test => test.published).length)
const filtered = computed(() => attempts.value.filter(({ submission: s, result: r }) => {
  return (!filterTest.value || s.testId === filterTest.value) && (!filterStudent.value || s.studentId === filterStudent.value) && (maxPercent.value === '' || r.percent <= Number(maxPercent.value)) && (status.value === 'all' || status.value === 'pending' && r.pending || status.value === 'passed' && r.passed || status.value === 'failed' && !r.pending && !r.passed)
}))
const filteredPassed = computed(() => filtered.value.filter(item => item.result.passed))
const visibleTests = computed(() => (tests.value || []).filter(test => {
  return (testStatus.value === 'all' || test.published === (testStatus.value === 'published')) &&
    test.title.toLocaleLowerCase().includes(testQuery.value.trim().toLocaleLowerCase())
}))
const isFiltered = computed(() => Boolean(filterTest.value || filterStudent.value || maxPercent.value !== '' || status.value !== 'all'))
const questionTypes: Record<QuestionType, string> = { text: 'Короткий ответ по эталону', choice: 'Один вариант', free: 'Произвольный текст', code: 'Код JavaScript (ручная оценка)', code_reference: 'Код по эталону' }
function linkNote(event: Event) {
  if (!draft.value) return
  const id = (event.target as HTMLSelectElement).value
  draft.value.noteId = id || null
  if (id) draft.value.notes = library.value?.find(n => n.id === id)?.body || ''
}
function switchSection(section: Section) {
  if (section === tab.value) return
  error.value = ''
  success.value = ''
  void router.push({ query: { section: section === 'overview' ? undefined : section } })
}
function clearFilters() {
  filterTest.value = ''
  filterStudent.value = ''
  maxPercent.value = ''
  status.value = 'all'
}
function openQueue() {
  clearFilters()
  status.value = 'pending'
  switchSection('answers')
}
function editDraft(test: TestDefinition) {
  draft.value = structuredClone(toRaw(test))
  error.value = ''
  success.value = ''
  nextTick(() => editorTitle.value?.focus())
}
function create() {
  testStatus.value = 'all'
  testQuery.value = ''
  editDraft({ id: '', title: '', notes: '', passPercent: 60, published: false, questions: [], updatedAt: '' })
}
function addQuestion() { draft.value?.questions.push({ id: 'q-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2), prompt: '', type: 'text', options: [], expected: '', points: 1 }) }
async function save() {
  if (!draft.value || busy.value || importingNote.value) return
  busy.value = true; error.value = ''; success.value = ''
  try {
    await $fetch('/api/platform/tests' + (draft.value.id ? '/' + draft.value.id : ''), { method: draft.value.id ? 'PUT' : 'POST', body: draft.value })
    draft.value = null; await reloadTests(); success.value = 'Тест сохранён. Опубликованные тесты доступны студентам.'
  } catch (e) { error.value = platformError(e) } finally { busy.value = false }
}
function gradeKey(s: Submission, questionId: string) { return `${s.id}:${questionId}` }
function prepare(s: Submission) { for (const a of s.answers) if (['free', 'code'].includes(a.question.type)) grades.value[gradeKey(s, a.question.id)] ??= { points: a.points ?? 0, comment: a.comment } }
async function review(s: Submission) {
  busy.value = true; error.value = ''; success.value = ''
  try {
    prepare(s)
    await $fetch('/api/platform/submissions/' + s.id, { method: 'PATCH', body: { grades: s.answers.filter(a => ['free', 'code'].includes(a.question.type)).map(a => ({ questionId: a.question.id, ...grades.value[gradeKey(s, a.question.id)] })) } })
    await reloadSubmissions(); success.value = 'Оценки сохранены. Результат и статистика обновлены.'
  } catch (e) { error.value = platformError(e) } finally { busy.value = false }
}
useHead({ title: computed(() => (isAdmin.value ? 'Кабинет администратора' : 'Кабинет преподавателя') + ' — практика') })
</script>
<template>
  <main class="workspace-page">
    <header class="desk-header enter" :class="{ 'staff-header-compact': tab !== 'overview' }">
      <div>
        <p class="eyebrow">{{ isAdmin ? 'Кабинет администратора' : 'Кабинет преподавателя' }}</p>
        <h1 class="page-title">Управление обучением</h1>
        <p v-if="tab === 'overview'" class="desk-lead">{{ isAdmin ? 'Управляйте материалами, участниками и результатами обучения.' : 'Готовьте материалы для занятий и проверяйте работы студентов.' }}</p>
      </div>
    </header>

    <nav class="admin-section-nav" aria-label="Разделы управления">
      <button v-for="section in visibleSections" :key="section.id" :class="{ active: tab === section.id }" :aria-pressed="tab === section.id" @click="switchSection(section.id)">
        {{ section.label }}
        <span v-if="section.id === 'answers' && pending" class="admin-nav-count" :aria-label="pending + ' на проверке'">{{ pending }}</span>
      </button>
    </nav>

    <p v-if="error" role="alert" class="people-alert people-alert-error">{{ error }}</p>
    <p v-if="success" role="status" class="people-alert people-alert-success enter">{{ success }}</p>

    <template v-if="tab === 'overview'">
      <section class="desk-feature enter" aria-labelledby="staff-next">
        <div>
          <p class="eyebrow">{{ isAdmin ? 'Обзор платформы' : 'Проверка работ' }}</p>
          <h2 id="staff-next" class="desk-title mt-2">{{ isAdmin ? 'Сводка по обучению' : submissionsError ? 'Очередь проверки недоступна' : pending ? 'Есть ответы для проверки' : 'Очередь проверки пуста' }}</h2>
          <p class="mt-3 text-sm">{{ isAdmin ? 'Откройте аналитику, чтобы сравнить результаты по тестам и учебным группам.' : 'Здесь собраны работы с развёрнутыми ответами и кодом, которым нужна ручная оценка.' }}</p>
          <button class="button-primary mt-4" @click="isAdmin ? switchSection('analytics') : openQueue()">{{ isAdmin ? 'Смотреть аналитику' : 'Открыть очередь проверки' }} <span class="action-arrow" aria-hidden="true">→</span></button>
        </div>
        <div class="desk-feature-side">
          <p class="text-3xl font-serif">{{ submissionsError ? '—' : pending }}</p>
          <p class="mt-1 text-sm">Работ на проверке</p>
          <button v-if="isAdmin" class="desk-text-button mt-1" @click="openQueue">К очереди проверки <span aria-hidden="true">→</span></button>
        </div>
      </section>
      <p v-if="testsError || submissionsError" role="alert" class="people-alert people-alert-error mt-4">Не удалось обновить часть данных. Повторим при восстановлении соединения.</p>
      <dl class="desk-surface desk-metrics mt-4">
        <div><dt>Опубликовано тестов</dt><dd>{{ testsError ? '—' : published }}</dd></div>
        <div><dt>Попыток отправлено</dt><dd>{{ submissionsError ? '—' : attempts.length }}</dd></div>
        <div><dt>Студентов</dt><dd>{{ students?.length ?? '—' }}</dd></div>
      </dl>
      <section class="desk-section" aria-labelledby="staff-actions">
        <h2 id="staff-actions" class="desk-title mb-3">Быстрые действия</h2>
        <div class="desk-actions">
          <button class="desk-surface desk-action" @click="draft || create(); switchSection('tests')"><span class="step-icon" aria-hidden="true"><span class="nav-icon nav-icon-tests" /></span><strong>{{ draft ? 'Продолжить редактирование' : 'Создать тест' }}</strong><span>Соберите вопросы и задайте порог прохождения.</span><span class="action-arrow" aria-hidden="true">→</span></button>
          <button class="desk-surface desk-action" @click="switchSection('notes')"><span class="step-icon" aria-hidden="true"><span class="nav-icon nav-icon-notes" /></span><strong>Открыть библиотеку</strong><span>Подготовьте конспект и опубликуйте его для студентов.</span><span class="action-arrow" aria-hidden="true">→</span></button>
          <button class="desk-surface desk-action" @click="switchSection('people')"><span class="step-icon" aria-hidden="true"><span class="nav-icon nav-icon-staff" /></span><strong>{{ isAdmin ? 'Управлять участниками' : 'Распределить по группам' }}</strong><span>{{ isAdmin ? 'Создавайте аккаунты и меняйте роли или группы.' : 'Найдите студента и назначьте учебную группу.' }}</span><span class="action-arrow" aria-hidden="true">→</span></button>
        </div>
      </section>
    </template>

    <template v-else-if="tab === 'tests'">
      <template v-if="!draft">
        <header class="desk-section-heading">
          <div><h2 class="desk-title">Тесты</h2><p>Управляйте черновиками и опубликованными заданиями.</p></div>
          <button class="button-primary" @click="create">Добавить тест +</button>
        </header>
        <p v-if="testsError" role="alert" class="people-alert people-alert-error">Не удалось загрузить тесты. <button class="underline" @click="reloadTests()">Повторить</button></p>
        <div v-if="tests?.length" class="desk-surface desk-filter mb-4">
          <label>Поиск по названию<input v-model="testQuery" type="search" class="field mt-2" placeholder="Введите название"></label>
          <label>Публикация<select v-model="testStatus" class="field mt-2"><option value="all">Все тесты</option><option value="published">Опубликованные</option><option value="draft">Черновики</option></select></label>
        </div>
        <div v-if="visibleTests.length" class="desk-surface desk-list">
          <article v-for="test in visibleTests" :key="test.id" class="desk-row">
            <div class="min-w-0">
              <h3 class="desk-row-title">{{ test.title }}</h3>
              <p class="desk-row-meta"><span class="desk-chip" :data-tone="test.published ? 'good' : undefined">{{ test.published ? 'Опубликован' : 'Черновик' }}</span><span>Вопросов: {{ test.questions.length }} · порог {{ test.passPercent }}%</span></p>
            </div>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
              <NuxtLink v-if="test.published" :to="{ path: '/tests', query: { id: test.id } }" class="desk-text-button">Как увидит студент <span aria-hidden="true">→</span></NuxtLink>
              <button class="button-secondary" @click="editDraft(test)">Редактировать</button>
            </div>
          </article>
        </div>
        <div v-else-if="!testsError" class="desk-surface desk-empty"><h3>{{ tests?.length ? 'Тесты не найдены' : 'Пока нет тестов' }}</h3><p>{{ tests?.length ? 'Измените запрос или фильтр публикации.' : 'Добавьте первый тест и сохраните его как черновик или опубликуйте.' }}</p></div>
      </template>
      <form v-else class="desk-form staff-editor enter" @submit.prevent="save">
        <header>
          <button type="button" class="desk-text-button mb-2" :disabled="busy" @click="draft = null">← К списку тестов</button>
          <h2 ref="editorTitle" tabindex="-1" class="desk-title">{{ draft.id ? 'Редактирование теста' : 'Новый тест' }}</h2>
        </header>
        <section class="desk-surface desk-form-section">
          <h3 class="desk-row-title">Настройки теста</h3>
          <div class="grid gap-4 sm:grid-cols-[1fr_minmax(9rem,14rem)]">
            <label>Название<input v-model="draft.title" required maxlength="200" class="field mt-2"></label>
            <label>Порог прохождения, %<input v-model.number="draft.passPercent" type="number" min="0" max="100" step="0.01" required class="field mt-2"></label>
          </div>
        </section>
        <details class="desk-surface desk-details" :open="Boolean(draft.notes || draft.noteId)">
          <summary class="desk-row"><span class="desk-row-title">Конспект к тесту</span><span class="ml-auto text-xs text-muted">{{ draft.noteId ? 'Связан с библиотекой' : draft.notes ? 'Добавлен' : 'По желанию' }}</span></summary>
          <div class="desk-detail-body grid gap-4">
            <label v-if="library?.length">Связанный конспект
              <select :value="draft.noteId || ''" class="field mt-2" :disabled="busy || importingNote" @change="linkNote">
                <option value="">Собственный текст</option><option v-for="note in library" :key="note.id" :value="note.id">{{ note.title }}{{ note.published ? '' : ' (черновик)' }}</option>
              </select>
              <span v-if="draft.noteId" class="mt-2 block text-xs text-muted">Правки конспекта автоматически появятся в тесте. Перед публикацией теста опубликуйте связанный конспект.</span>
            </label>
            <NoteContentEditor v-model="draft.notes" v-model:importing="importingNote" label="Конспект" :readonly="Boolean(draft.noteId)" :disabled="busy" />
          </div>
        </details>
        <div class="desk-section-heading mb-0"><h3 class="desk-title">Вопросы</h3><span class="text-sm text-muted">Всего: {{ draft.questions.length }}</span></div>
        <div v-if="!draft.questions.length" class="desk-surface desk-empty"><p>Добавьте вопрос и выберите, как он будет проверяться.</p></div>
        <section v-for="(q, index) in draft.questions" :key="q.id" class="desk-surface desk-form-section enter">
          <header class="mb-3 flex flex-wrap items-center justify-between gap-2"><h4 class="desk-row-title">Вопрос {{ index + 1 }}</h4><button type="button" class="desk-text-button" @click="draft.questions.splice(index, 1)">Удалить вопрос</button></header>
          <label class="block">Условие<textarea v-model="q.prompt" required rows="3" maxlength="5000" class="field mt-2" /></label>
          <div class="my-4 grid gap-4 sm:grid-cols-[1fr_10rem]">
            <label>Поле ответа<select v-model="q.type" class="field mt-2" @change="q.expected = ''; q.options = []"><option v-for="(label, value) in questionTypes" :key="value" :value="value">{{ label }}</option></select></label>
            <label>Максимум баллов<input v-model.number="q.points" required type="number" min="1" max="100" step="1" class="field mt-2"></label>
          </div>
          <template v-if="q.type === 'choice'">
            <label class="block">Варианты (каждый с новой строки)<textarea :value="q.options.join('\n')" rows="4" class="field mt-2" @input="q.options = ($event.target as HTMLTextAreaElement).value.split('\n')" /></label>
            <label class="mt-4 block">Верный вариант<select v-model="q.expected" required class="field mt-2"><option disabled value="">Выберите</option><option v-for="option in q.options.filter(Boolean)" :key="option" :value="option">{{ option }}</option></select></label>
          </template>
          <label v-else-if="q.type === 'text'" class="block">Эталон ответа<input v-model="q.expected" required maxlength="5000" class="field mt-2"><span class="mt-2 block text-xs text-muted">Проверка учитывает регистр. Пробелы по краям не учитываются.</span></label>
          <div v-else-if="q.type === 'code_reference'">
            <p class="mb-3 text-sm">Эталон кода</p>
            <ClientOnly><div class="overflow-hidden rounded-lg border border-line"><CodeEditor :model-value="q.expected" label="Эталон кода" @update:model-value="q.expected = $event" /></div></ClientOnly>
            <p class="mt-3 text-xs leading-6 text-muted">Автоматическая проверка сравнивает текст кода с эталоном без выполнения. Пробелы по краям и тип переноса строк не учитываются.</p>
          </div>
          <p v-else class="text-sm text-muted">{{ q.type === 'code' ? 'Студент увидит редактор JavaScript.' : 'Студент ответит своими словами.' }} Вы выставите баллы и сможете добавить комментарий.</p>
        </section>
        <button type="button" class="button-secondary justify-self-start" @click="addQuestion">Добавить вопрос +</button>
        <footer class="desk-surface desk-form-section">
          <label class="flex items-center gap-3 font-medium"><input v-model="draft.published" type="checkbox">Опубликовать для студентов</label>
          <p class="mt-2 text-sm text-muted">Старые попытки сохраняют вопросы и порог на момент отправки.</p>
          <div class="desk-form-actions pb-0"><button class="button-primary" :disabled="busy || importingNote || !draft.questions.length">{{ busy ? 'Сохраняем…' : 'Сохранить тест' }}</button><button type="button" class="button-secondary" :disabled="busy" @click="draft = null">Отмена</button></div>
        </footer>
      </form>
    </template>

    <template v-else-if="tab === 'answers'">
      <header class="desk-section-heading">
        <div><h2 class="desk-title">Ответы и результаты</h2><p>Работы с ручной оценкой идут первыми.</p></div>
        <button v-if="status !== 'pending' && pending" class="button-secondary" @click="openQueue">Только на проверке <span class="desk-chip" data-tone="waiting">{{ pending }}</span></button>
      </header>
      <p v-if="submissionsError" role="alert" class="people-alert people-alert-error">Не удалось обновить ответы. <button class="underline" @click="reloadSubmissions()">Повторить</button></p>
      <div class="desk-surface desk-filter">
        <label>Тест<select v-model="filterTest" class="field mt-2"><option value="">Все тесты</option><option v-for="test in tests" :key="test.id" :value="test.id">{{ test.title }}</option></select></label>
        <label>Студент<select v-model="filterStudent" class="field mt-2"><option value="">Все студенты</option><option v-for="student in students" :key="student.id" :value="student.id">{{ student.login }}</option></select></label>
        <label>Процент меньше или равен<input v-model="maxPercent" type="number" min="0" max="100" step="0.01" class="field mt-2" placeholder="Например, 60"></label>
        <label>Статус<select v-model="status" class="field mt-2"><option value="all">Все статусы</option><option value="pending">Ожидает проверки</option><option value="passed">Пройден</option><option value="failed">Не пройден</option></select></label>
      </div>
      <div class="desk-section-heading mt-4 text-sm text-muted">
        <span>Попыток: {{ filtered.length }} · Успешных: {{ filteredPassed.length }} · Уникальных прошедших: {{ new Set(filteredPassed.map(item => item.submission.studentId)).size }}</span>
        <button v-if="isFiltered" class="desk-text-button" @click="clearFilters">Сбросить фильтры</button>
      </div>
      <div v-if="filtered.length" class="desk-surface desk-list">
        <details v-for="{ submission, result, state } in filtered" :key="submission.id" class="desk-details" @toggle="prepare(submission)">
          <summary class="desk-row">
            <span class="min-w-0"><strong class="desk-row-title">{{ submission.studentLogin }}</strong><span class="desk-row-meta">{{ submission.testTitle }} · {{ new Date(submission.submittedAt).toLocaleString('ru-RU') }}</span></span>
            <span class="desk-attempt-result"><span class="desk-score">{{ result.percent }}%</span><span class="desk-chip" :data-tone="state.tone">{{ state.label }}</span></span>
          </summary>
          <form class="desk-detail-body" @submit.prevent="review(submission)">
            <p class="mb-3 text-sm text-muted">Порог: {{ submission.passPercent }}% · {{ result.earned }} / {{ result.max }} баллов<span v-if="result.pending"> · процент предварительный</span></p>
            <section v-for="answer in submission.answers" :key="answer.question.id" class="border-t border-line py-4">
              <h3 class="desk-row-title">{{ answer.question.prompt }}</h3>
              <p class="desk-row-meta">{{ questionTypes[answer.question.type] }} · максимум {{ answer.question.points }}</p>
              <pre class="my-3 whitespace-pre-wrap break-words rounded-lg bg-soft p-3 text-sm">{{ answer.value }}</pre>
              <div v-if="['free', 'code'].includes(answer.question.type) && grades[gradeKey(submission, answer.question.id)]" class="grid gap-3 sm:grid-cols-[9rem_1fr]">
                <label class="text-sm">Баллы<input v-model.number="grades[gradeKey(submission, answer.question.id)]!.points" required type="number" min="0" :max="answer.question.points" step="0.5" class="field mt-2"></label>
                <label class="text-sm">Комментарий<textarea v-model="grades[gradeKey(submission, answer.question.id)]!.comment" maxlength="5000" rows="2" class="field mt-2" /></label>
              </div>
              <div v-else><p class="text-sm text-muted">Автоматическая оценка: {{ answer.points }} / {{ answer.question.points }}. Эталон:</p><pre class="mt-2 whitespace-pre-wrap break-words rounded-lg bg-soft p-3 text-xs">{{ answer.question.expected }}</pre></div>
            </section>
            <button v-if="submission.answers.some(answer => ['free', 'code'].includes(answer.question.type))" class="button-primary" :disabled="busy">{{ busy ? 'Сохраняем…' : 'Сохранить оценки' }}</button>
          </form>
        </details>
      </div>
      <div v-else-if="!submissionsError" class="desk-surface desk-empty"><h3>{{ isFiltered ? 'По выбранным условиям ответов нет' : 'Попыток пока нет' }}</h3><p>{{ isFiltered ? 'Измените или сбросьте фильтры.' : 'Здесь появятся работы, когда студенты отправят тесты.' }}</p></div>
    </template>

    <NotesManager v-else-if="tab === 'notes'" @changed="reloadLibrary()" />
    <PeopleManager v-else-if="tab === 'people'" />
    <GlobalAnalytics v-else-if="tab === 'analytics' && isAdmin" />
  </main>
</template>
