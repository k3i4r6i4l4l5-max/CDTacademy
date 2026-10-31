<script setup lang="ts">
import { resultOf } from '#shared/utils/platform'
import type { TestDefinition, Submission, PublicUser, QuestionType, NoteDefinition } from '../../../shared/types/platform'
const { data: tests, refresh: reloadTests } = await useFetch<TestDefinition[]>('/api/platform/tests')
const { data: submissions, refresh: reloadSubmissions } = await useFetch<Submission[]>('/api/platform/submissions')
const { data: students } = await useFetch<PublicUser[]>('/api/platform/students')
const { data: library, refresh: reloadLibrary } = await useFetch<NoteDefinition[]>('/api/platform/notes')
const { user } = useAuth()
usePlatformSync(() => Promise.all([reloadTests(), reloadSubmissions(), reloadLibrary()]))
const tab = ref<'tests' | 'answers' | 'people' | 'analytics' | 'notes'>('tests')
const draft = ref<TestDefinition | null>(null)
// Редактируем копию теста: фоновая синхронизация не заменяет текущие правки формы.
const error = ref(''), success = ref(''), busy = ref(false)
const filterTest = ref(''), filterStudent = ref(''), maxPercent = ref<number | ''>(''), status = ref('all')
const grades = ref<Record<string, { points: number; comment: string }>>({})
const filtered = computed(() => (submissions.value || []).filter(s => {
  const r = resultOf(s)
  return (!filterTest.value || s.testId === filterTest.value) && (!filterStudent.value || s.studentId === filterStudent.value) && (maxPercent.value === '' || r.percent <= Number(maxPercent.value)) && (status.value === 'all' || status.value === 'pending' && r.pending || status.value === 'passed' && r.passed || status.value === 'failed' && !r.pending && !r.passed)
}))
const passed = computed(() => (submissions.value || []).filter(s => resultOf(s).passed))
const passedStudents = computed(() => new Set(passed.value.map(s => s.studentId)).size)
const questionTypes: Record<QuestionType, string> = { text: 'Короткий ответ по эталону', choice: 'Один вариант', free: 'Произвольный текст', code: 'Код JavaScript (ручная оценка)', code_reference: 'Код по эталону' }
function linkNote(event: Event) {
  if (!draft.value) return
  const id = (event.target as HTMLSelectElement).value
  draft.value.noteId = id || null
  if (id) draft.value.notes = library.value?.find(n => n.id === id)?.body || ''
}
function create() { draft.value = { id: '', title: '', notes: '', passPercent: 60, published: false, questions: [], updatedAt: '' }; success.value = ''; error.value = '' }
function edit(test: TestDefinition) { draft.value = structuredClone(toRaw(test)); error.value = ''; success.value = '' }
function addQuestion() { draft.value?.questions.push({ id: 'q-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2), prompt: '', type: 'text', options: [], expected: '', points: 1 }) }
async function importNotes(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file || !draft.value) return
  if (file.size > 150000) { error.value = 'Конспект должен быть не больше 150 КБ.'; return }
  draft.value.notes = await file.text()
}
async function save() {
  if (!draft.value || busy.value) return
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
useHead({ title: 'Адм-панель — практика' })
</script>
<template>
  <main class="mx-auto max-w-6xl px-5 py-10"><NuxtLink to="/" class="text-sm text-muted">← Учебное приложение</NuxtLink><h1 class="page-title mt-6">Управление обучением</h1><p class="mt-4 text-sm text-muted">Тесты, ответы студентов и результаты прохождения.</p>
    <nav class="admin-section-nav" aria-label="Разделы управления">
      <button :class="{active: tab === 'tests'}" :aria-pressed="tab === 'tests'" @click="tab = 'tests'">Редактор тестов</button>
      <button :class="{active: tab === 'answers'}" :aria-pressed="tab === 'answers'" @click="tab = 'answers'">Ответы и результаты</button>
      <button :class="{active: tab === 'notes'}" :aria-pressed="tab === 'notes'" @click="tab = 'notes'; reloadLibrary()">Конспекты</button>
      <button :class="{active: tab === 'people'}" :aria-pressed="tab === 'people'" @click="tab = 'people'">Студенты и группы</button>
      <button v-if="user?.role === 'admin'" :class="{active: tab === 'analytics'}" :aria-pressed="tab === 'analytics'" @click="tab = 'analytics'">Общая аналитика</button>
    </nav>
    <p v-if="error" role="alert" class="mb-5 rounded-md border border-accent p-4 text-sm text-accent">{{ error }}</p><p v-if="success" role="status" class="mb-5 text-sm text-success">{{ success }}</p>
    <template v-if="tab === 'tests'">
      <template v-if="!draft"><button class="button-primary mb-6" @click="create">Добавить тест +</button><article v-for="test in tests" :key="test.id" class="panel mb-4 flex flex-wrap items-center justify-between gap-4"><div><h2 class="text-lg">{{ test.title }}</h2><p class="mt-2 text-xs text-muted">{{ test.published ? 'Опубликован' : 'Черновик' }} · {{ test.questions.length }} вопросов · порог {{ test.passPercent }}%</p><p class="mt-2 text-xs text-success">Прошли: {{ new Set(passed.filter(s => s.testId === test.id).map(s => s.studentId)).size }} студентов</p></div><div class="flex flex-wrap items-center gap-3"><NuxtLink v-if="test.published" :to="{path:'/tests',query:{id:test.id}}" class="text-sm text-accent">Как увидит студент →</NuxtLink><button class="button-secondary" @click="edit(test)">Редактировать</button></div></article><p v-if="!tests?.length" class="text-muted">Добавьте первый тест.</p></template>
      <form v-else class="panel space-y-6" @submit.prevent="save"><h2 class="text-xl">{{ draft.id ? 'Редактирование теста' : 'Новый тест' }}</h2><label class="block text-sm">Название<input v-model="draft.title" required maxlength="200" class="field mt-2"></label><div class="grid gap-5 sm:grid-cols-2"><label class="block text-sm">Порог прохождения, % (включительно)<input v-model.number="draft.passPercent" type="number" min="0" max="100" step="0.01" required class="field mt-2"></label><label class="flex items-center gap-3 text-sm"><input v-model="draft.published" type="checkbox">Опубликовать для студентов</label></div>
        <div><label v-if="library?.length" class="mb-4 block text-sm">Связанный конспект<select :value="draft.noteId || ''" class="field mt-2" @change="linkNote"><option value="">Без связи — собственный текст</option><option v-for="note in library" :key="note.id" :value="note.id">{{ note.title }}{{ note.published ? '' : ' (черновик)' }}</option></select><span v-if="draft.noteId" class="mt-2 block text-xs text-muted">Изменения этого конспекта автоматически появятся в тесте у студентов. Для публикации теста сначала опубликуйте конспект.</span></label><label class="block text-sm">Конспект<textarea v-model="draft.notes" :readonly="Boolean(draft.noteId)" rows="9" maxlength="100000" class="field mt-2" placeholder="Теория, примеры и пояснения. Код можно окружить тройными обратными кавычками." /></label><label class="mt-3 block text-xs text-muted">Или вставить из .md / .txt (заменит текст выше)<input type="file" accept=".md,.txt,text/plain,text/markdown" class="field mt-2" :disabled="Boolean(draft.noteId)" @change="importNotes"></label><details v-if="draft.notes" class="mt-4"><summary class="cursor-pointer text-sm text-accent">Предпросмотр конспекта</summary><div class="mt-3 panel"><TestNotes :text="draft.notes" /></div></details></div>
        <section v-for="(q, index) in draft.questions" :key="q.id" class="rounded-lg border border-line bg-paper p-5"><div class="mb-4 flex justify-between"><h3 class="font-medium">Вопрос {{ index + 1 }}</h3><button type="button" class="text-xs text-accent" @click="draft.questions.splice(index, 1)">Удалить вопрос</button></div><label class="block text-sm">Условие<textarea v-model="q.prompt" required rows="3" maxlength="5000" class="field mt-2" /></label><div class="my-4 grid gap-4 sm:grid-cols-2"><label class="text-sm">Поле ответа<select v-model="q.type" class="field mt-2" @change="q.expected = ''; q.options = []"><option v-for="(label, value) in questionTypes" :key="value" :value="value">{{ label }}</option></select></label><label class="text-sm">Максимум баллов<input v-model.number="q.points" required type="number" min="1" max="100" step="1" class="field mt-2"></label></div>
          <template v-if="q.type === 'choice'"><label class="block text-sm">Варианты (каждый с новой строки)<textarea :value="q.options.join('\n')" rows="4" class="field mt-2" @input="q.options = ($event.target as HTMLTextAreaElement).value.split('\n')" /></label><label class="mt-4 block text-sm">Верный вариант<select v-model="q.expected" required class="field mt-2"><option disabled value="">Выберите</option><option v-for="option in q.options.filter(Boolean)" :key="option" :value="option">{{ option }}</option></select></label></template>
          <label v-else-if="q.type === 'text'" class="block text-sm">Эталон ответа<input v-model="q.expected" required maxlength="5000" class="field mt-2"><span class="mt-2 block text-xs text-muted">Сравнение с учётом регистра, пробелы по краям не учитываются.</span></label><div v-else-if="q.type === 'code_reference'"><p class="mb-3 text-sm">Эталон кода</p><ClientOnly><div class="overflow-hidden rounded-lg border border-line"><CodeEditor :model-value="q.expected" label="Эталон кода" @update:model-value="q.expected = $event" /></div></ClientOnly><p class="mt-3 text-xs leading-6 text-muted">Автоматическое сравнение текста. Пробелы по краям и тип переноса строк не учитываются; остальные символы должны совпасть. Код не выполняется.</p></div><p v-else class="text-xs leading-6 text-muted">{{ q.type === 'code' ? 'Студент увидит редактор JavaScript.' : 'Студент увидит многострочное поле для ответа своими словами.' }} Оценку и комментарий выставляет преподаватель или администратор.</p>
        </section><div class="flex flex-wrap gap-3"><button type="button" class="button-secondary" @click="addQuestion">Добавить вопрос +</button><button class="button-primary" :disabled="busy || !draft.questions.length">{{ busy ? 'Сохраняем…' : 'Сохранить тест' }}</button><button type="button" class="button-secondary" @click="draft = null">Отмена</button></div><p class="text-xs text-muted">Старые попытки сохраняют условия и порог, действовавшие на момент отправки.</p>
      </form>
    </template>
    <template v-else-if="tab === 'answers'"><div class="panel mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><label class="text-xs">Тест<select v-model="filterTest" class="field mt-2"><option value="">Все тесты</option><option v-for="test in tests" :key="test.id" :value="test.id">{{ test.title }}</option></select></label><label class="text-xs">Студент<select v-model="filterStudent" class="field mt-2"><option value="">Все студенты</option><option v-for="student in students" :key="student.id" :value="student.id">{{ student.login }}</option></select></label><label class="text-xs">Процент меньше или равен<input v-model="maxPercent" type="number" min="0" max="100" step="0.01" class="field mt-2" placeholder="Например, 60"></label><label class="text-xs">Статус<select v-model="status" class="field mt-2"><option value="all">Все</option><option value="passed">Пройден</option><option value="failed">Не пройден</option><option value="pending">Ожидает проверки</option></select></label><button class="text-left text-xs text-accent" @click="filterTest = ''; filterStudent = ''; maxPercent = ''; status = 'all'">Сбросить фильтры</button></div>
      <p class="mb-4 text-sm text-muted">Найдено попыток: {{ filtered.length }} · Успешных: {{ filtered.filter(s => resultOf(s).passed).length }} · Уникальных прошедших: {{ new Set(filtered.filter(s => resultOf(s).passed).map(s => s.studentId)).size }}</p><p class="mb-6 text-xs text-muted">Процент ожидающих проверки предварительный: неоценённые ответы пока дают 0 баллов. Фильтр ≤ применяется и к этому проценту.</p>
      <p v-if="!filtered.length" class="panel text-sm text-muted">По выбранным условиям ответов нет.</p><details v-for="s in filtered" :key="s.id" class="panel mb-4" @toggle="prepare(s)"><summary class="cursor-pointer text-sm leading-7"><strong>{{ s.studentLogin }}</strong> · {{ s.testTitle }} · {{ resultOf(s).percent }}% · {{ resultOf(s).pending ? 'Ожидает проверки' : resultOf(s).passed ? 'Пройден' : 'Не пройден' }}<span class="ml-3 text-xs text-muted">{{ new Date(s.submittedAt).toLocaleString('ru-RU') }}</span></summary><p class="mt-3 text-xs text-muted">Порог этой попытки: {{ s.passPercent }}% · {{ resultOf(s).earned }} / {{ resultOf(s).max }} баллов</p>
        <section v-for="a in s.answers" :key="a.question.id" class="mt-5 border-t border-line pt-5"><h3 class="text-sm font-medium">{{ a.question.prompt }}</h3><p class="mt-2 text-xs text-muted">{{ questionTypes[a.question.type] }} · максимум {{ a.question.points }}</p><pre class="my-3 whitespace-pre-wrap break-words rounded-md bg-soft p-4 text-sm">{{ a.value }}</pre><div v-if="['free', 'code'].includes(a.question.type) && grades[gradeKey(s, a.question.id)]" class="grid gap-4 sm:grid-cols-[150px_1fr]"><label class="text-xs">Баллы<input v-model.number="grades[gradeKey(s, a.question.id)]!.points" type="number" min="0" :max="a.question.points" step="0.5" class="field mt-2"></label><label class="text-xs">Комментарий<textarea v-model="grades[gradeKey(s, a.question.id)]!.comment" maxlength="5000" rows="2" class="field mt-2" /></label></div><div v-else><p class="text-xs text-muted">Автоматическая оценка: {{ a.points }} / {{ a.question.points }}. Эталон:</p><pre class="mt-2 whitespace-pre-wrap break-words rounded-md bg-soft p-3 text-xs">{{ a.question.expected }}</pre></div></section><button v-if="s.answers.some(a => ['free', 'code'].includes(a.question.type))" class="button-primary mt-5" :disabled="busy" @click="review(s)">Сохранить оценки</button>
      </details>
    </template>
    <NotesManager v-else-if="tab === 'notes'" @changed="reloadLibrary()" />
    <PeopleManager v-else-if="tab === 'people'" />
    <GlobalAnalytics v-else-if="tab === 'analytics' && user?.role === 'admin'" />
  </main>
</template>
