<script setup lang="ts">
import type { NoteDefinition } from '../../shared/types/platform'
const emit = defineEmits<{ changed: [] }>()
const { data: notes, refresh } = await useFetch<NoteDefinition[]>('/api/platform/notes')
usePlatformSync(() => refresh())
const draft = ref<NoteDefinition | null>(null)
// Библиотека обновляется с сервера, а редактируемый конспект хранится отдельной копией.
const busy = ref(false), error = ref(''), success = ref('')
function create() { draft.value = { id:'', title:'', body:'', published:false, updatedAt:'' }; error.value = ''; success.value = '' }
function edit(note: NoteDefinition) { draft.value = structuredClone(toRaw(note)); error.value = ''; success.value = '' }
async function importFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file || !draft.value) return
  if (file.size > 150000) { error.value = 'Файл должен быть не больше 150 КБ.'; return }
  try { const content = await file.text(); if (content.length > 100000) { error.value = 'Конспект должен быть не длиннее 100 000 символов.'; return }; draft.value.body = content } catch { error.value = 'Не удалось прочитать файл.' }
}
async function save() {
  if (!draft.value || busy.value) return
  busy.value = true; error.value = ''; success.value = ''
  try { await $fetch<NoteDefinition>('/api/platform/notes' + (draft.value.id ? '/' + draft.value.id : ''), { method: draft.value.id ? 'PUT' : 'POST', body:draft.value }); draft.value = null; await refresh(); emit('changed'); success.value = 'Конспект сохранён. Опубликованный материал доступен студентам в разделе «Конспекты».' } catch { error.value = 'Не удалось сохранить конспект. Проверьте название, текст и соединение с сервером.' } finally { busy.value = false }
}
</script>
<template>
  <section><h2 class="text-xl">Конспекты</h2><p class="my-4 text-sm text-muted">Самостоятельные учебные материалы: теория, примеры кода и пояснения.</p><p v-if="error" role="alert" class="mb-4 text-sm text-accent">{{ error }}</p><p v-if="success" role="status" class="mb-4 text-sm text-success">{{ success }}</p>
    <template v-if="!draft"><button class="button-primary mb-6" @click="create">Добавить конспект +</button><article v-for="note in notes" :key="note.id" class="panel mb-4 flex flex-wrap items-center justify-between gap-4"><div><h3 class="text-lg">{{ note.title }}</h3><p class="mt-2 text-xs text-muted">{{ note.published ? 'Опубликован' : 'Черновик' }} · {{ new Date(note.updatedAt).toLocaleDateString('ru-RU') }}</p></div><button class="button-secondary" @click="edit(note)">Редактировать конспект</button></article><p v-if="!notes?.length" class="text-sm text-muted">Конспектов пока нет.</p></template>
    <form v-else class="panel space-y-5" @submit.prevent="save"><label class="block text-sm">Название конспекта<input v-model="draft.title" required maxlength="200" class="field mt-2"></label><label class="block text-sm">Текст конспекта<textarea v-model="draft.body" required rows="16" maxlength="100000" class="field mt-2 font-mono" placeholder="Теория и разобранные примеры. Блоки кода окружайте тройными обратными кавычками." /></label><label class="block text-xs text-muted">Загрузить .md / .txt (заменит текст)<input type="file" accept=".md,.txt,text/plain,text/markdown" class="field mt-2" @change="importFile"></label><label class="flex items-center gap-3 text-sm"><input v-model="draft.published" type="checkbox">Опубликовать конспект для студентов</label><details v-if="draft.body"><summary class="cursor-pointer text-sm text-accent">Предпросмотр</summary><div class="panel mt-4"><TestNotes :text="draft.body" /></div></details><div class="flex flex-wrap gap-3"><button class="button-primary" :disabled="busy || !draft.title.trim() || !draft.body.trim()">{{ busy ? 'Сохраняем…' : 'Сохранить конспект' }}</button><button type="button" class="button-secondary" :disabled="busy" @click="draft = null">Отмена</button></div></form>
  </section>
</template>
