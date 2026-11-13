<script setup lang="ts">
import type { NoteDefinition } from '../../shared/types/platform'

const emit = defineEmits<{ changed: [] }>()
const { data: notes, error: loadError, refresh } = await useFetch<NoteDefinition[]>('/api/platform/notes')
usePlatformSync(() => refresh())
const draft = ref<NoteDefinition | null>(null)
const editorTitle = ref<HTMLElement>()
const busy = ref(false)
const importing = ref(false)
const error = ref('')
const success = ref('')
const query = ref('')
const visibility = ref('all')
const visibleNotes = computed(() => (notes.value || [])
  .filter(note => (visibility.value === 'all' || note.published === (visibility.value === 'published')) &&
    note.title.toLocaleLowerCase().includes(query.value.trim().toLocaleLowerCase()))
  .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
)
function edit(note: NoteDefinition) {
  draft.value = structuredClone(toRaw(note))
  error.value = ''
  success.value = ''
  nextTick(() => editorTitle.value?.focus())
}
function create() {
  query.value = ''
  visibility.value = 'all'
  edit({ id: '', title: '', body: '', published: false, updatedAt: '' })
}
async function save() {
  if (!draft.value || busy.value || importing.value) return
  busy.value = true
  error.value = ''
  success.value = ''
  try {
    const saved = await $fetch<NoteDefinition>('/api/platform/notes' + (draft.value.id ? '/' + draft.value.id : ''), { method: draft.value.id ? 'PUT' : 'POST', body: draft.value })
    draft.value = null
    notes.value = [...(notes.value || []).filter(note => note.id !== saved.id), saved]
    if (visibility.value !== 'all' && saved.published !== (visibility.value === 'published')) visibility.value = 'all'
    emit('changed')
    success.value = saved.published ? 'Конспект опубликован и доступен студентам.' : 'Черновик конспекта сохранён.'
    await refresh()
  } catch {
    error.value = 'Не удалось сохранить конспект. Проверьте название, текст и соединение с сервером.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section aria-labelledby="library-title">
    <header class="desk-section-heading">
      <div><h2 id="library-title" class="desk-title">Конспекты</h2><p>Публикуйте материалы отдельно или прикрепляйте их к тестам.</p></div>
      <button v-if="!draft" class="button-primary" @click="create">Добавить конспект +</button>
    </header>
    <p v-if="loadError" role="alert" class="people-alert people-alert-error">Не удалось обновить конспекты. <button class="underline" @click="refresh()">Повторить</button></p>
    <p v-if="error" role="alert" class="people-alert people-alert-error">{{ error }}</p>
    <p v-if="success" role="status" class="people-alert people-alert-success enter">{{ success }}</p>

    <template v-if="!draft">
      <div v-if="notes?.length" class="desk-surface desk-filter mb-4">
        <label>Поиск по названию<input v-model="query" type="search" class="field mt-2" placeholder="Введите название"></label>
        <label>Публикация<select v-model="visibility" class="field mt-2"><option value="all">Все конспекты</option><option value="published">Опубликованные</option><option value="draft">Черновики</option></select></label>
      </div>
      <div v-if="visibleNotes.length" class="desk-surface desk-list">
        <article v-for="note in visibleNotes" :key="note.id" class="desk-row">
          <div class="min-w-0">
            <h3 class="desk-row-title">{{ note.title }}</h3>
            <p class="desk-row-meta"><span class="desk-chip" :data-tone="note.published ? 'good' : undefined">{{ note.published ? 'Опубликован' : 'Черновик' }}</span> {{ new Date(note.updatedAt).toLocaleDateString('ru-RU') }}</p>
          </div>
          <button class="button-secondary" @click="edit(note)">Редактировать конспект</button>
        </article>
      </div>
      <div v-else-if="!loadError" class="desk-surface desk-empty"><h3>{{ notes?.length ? 'Конспекты не найдены' : 'Конспектов пока нет' }}</h3><p>{{ notes?.length ? 'Измените запрос или фильтр публикации.' : 'Добавьте теорию, примеры или пояснения к занятию.' }}</p></div>
    </template>
    <form v-else class="desk-form enter" @submit.prevent="save">
      <header><button type="button" class="desk-text-button mb-2" :disabled="busy" @click="draft = null">← К списку конспектов</button><h3 ref="editorTitle" tabindex="-1" class="desk-title">{{ draft.id ? 'Редактирование конспекта' : 'Новый конспект' }}</h3></header>
      <div class="desk-surface desk-form-section grid gap-4">
        <label>Название конспекта<input v-model="draft.title" required maxlength="200" class="field mt-2"></label>
        <NoteContentEditor v-model="draft.body" v-model:importing="importing" :title="draft.title" :disabled="busy" />
      </div>
      <footer class="desk-surface desk-form-section">
        <label class="flex items-center gap-3 font-medium"><input v-model="draft.published" type="checkbox">Опубликовать конспект для студентов</label>
        <div class="desk-form-actions pb-0"><button class="button-primary" :disabled="busy || importing || !draft.title.trim() || !draft.body.trim()">{{ busy ? 'Сохраняем…' : 'Сохранить конспект' }}</button><button type="button" class="button-secondary" :disabled="busy" @click="draft = null">Отмена</button></div>
      </footer>
    </form>
  </section>
</template>
