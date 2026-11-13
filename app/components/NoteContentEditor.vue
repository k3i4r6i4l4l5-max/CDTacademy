<script setup lang="ts">
const props = withDefaults(defineProps<{
  label?: string
  title?: string
  readonly?: boolean
  disabled?: boolean
}>(), { label: 'Текст конспекта' })
const text = defineModel<string>({ required: true })
const importing = defineModel<boolean>('importing', { default: false })
const id = useId()
const error = ref('')
const importedFile = ref('')
const omittedImages = ref(false)
let disposed = false
onBeforeUnmount(() => {
  disposed = true
  if (importing.value) importing.value = false
})

async function load(file: File) {
  if (props.readonly || props.disabled || importing.value) return
  error.value = ''
  importing.value = true
  const previousText = text.value
  try {
    const result = await importNoteFile(file)
    if (disposed || props.readonly || text.value !== previousText) return
    text.value = result.content
    importedFile.value = file.name
    omittedImages.value = result.omittedImages
  } catch (cause) {
    if (!disposed) error.value = cause instanceof Error ? cause.message : 'Не удалось прочитать файл.'
  } finally {
    if (!disposed) importing.value = false
  }
}
function select(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) void load(file)
}
function drop(event: DragEvent) {
  const file = event.dataTransfer?.files[0]
  if (file) void load(file)
}
</script>

<template>
  <div class="note-compose">
    <div class="note-compose-grid">
      <div class="min-w-0">
        <div v-if="!readonly" class="note-file-zone" @dragover.prevent @drop.prevent="drop">
          <label :for="id + '-file'" class="font-medium">Импортировать файл</label>
          <p :id="id + '-file-help'" class="mt-1 text-xs text-muted">Выберите или перетащите MD, DOCX или TXT. Импорт заменит текст редактора.</p>
          <input :id="id + '-file'" class="field mt-2" type="file" :accept="noteFileAccept" :aria-describedby="id + '-file-help'" :disabled="disabled || importing" @change="select">
          <p v-if="importing || importedFile" role="status" class="mt-2 break-words text-xs text-muted">{{ importing ? 'Читаем файл…' : 'Загружен файл «' + importedFile + '».' }}</p>
          <p v-if="error" role="alert" class="mt-2 text-sm text-accent">{{ error }}</p>
          <p v-if="!importing && omittedImages" class="mt-2 text-xs text-muted">Изображения из Word пропущены.</p>
        </div>
        <label :for="id + '-body'" class="font-medium">{{ label }}</label>
        <textarea
          :id="id + '-body'" v-model="text" rows="15" :maxlength="noteBodyLimit"
          class="field mt-2 font-mono" :readonly="readonly" :disabled="disabled || importing"
          :aria-describedby="id + '-help'" placeholder="Теория и разобранные примеры"
        />
        <p :id="id + '-help'" class="mt-2 text-xs text-muted">Поддерживается Markdown. Окружайте блоки кода тройными обратными кавычками.</p>
      </div>
      <section class="note-preview desk-surface" :aria-labelledby="id + '-preview'">
        <header class="note-preview-header">
          <h4 :id="id + '-preview'" class="desk-row-title">Предпросмотр</h4>
          <p class="mt-1 text-xs text-muted">Так конспект увидит студент</p>
        </header>
        <div class="note-preview-body">
          <p v-if="title?.trim()" class="desk-title mb-4">{{ title }}</p>
          <TestNotes v-if="text.trim()" :text="text" />
          <p v-else class="text-sm text-muted">{{ readonly ? 'Текст конспекта пока пуст.' : 'Загрузите файл или напишите текст, чтобы увидеть результат.' }}</p>
        </div>
      </section>
    </div>
  </div>
</template>
