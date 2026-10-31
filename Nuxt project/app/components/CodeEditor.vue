<script setup lang="ts">
import { EditorView, basicSetup } from 'codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { keymap } from '@codemirror/view'
import { indentWithTab } from '@codemirror/commands'
const props = defineProps<{ modelValue: string; label?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string]; run: [] }>()
const host = ref<HTMLDivElement>()
let editor: EditorView | undefined
// Создаём редактор только в браузере; изменения его документа передаём наружу через v-model.
onMounted(() => {
  editor = new EditorView({ parent: host.value, doc: props.modelValue, extensions: [
    basicSetup, javascript(),
    keymap.of([indentWithTab, { key: 'Mod-Enter', run: () => { emit('run'); return true } }]),
    EditorView.contentAttributes.of({ 'aria-label': props.label || 'Ответ с кодом JavaScript' }),
    EditorView.updateListener.of(update => { if (update.docChanged) emit('update:modelValue', update.state.doc.toString()) }),
    EditorView.theme({ '&': { fontSize: '14px', backgroundColor: '#fdfcf9' }, '.cm-content': { fontFamily: 'Consolas, monospace', minHeight: '180px', padding: '16px 0' }, '.cm-gutters': { background: '#f4f1ec', color: '#91877c', border: 'none' }, '.cm-scroller': { overflow: 'auto' }, '&.cm-focused': { outline: '2px solid #b85e32', outlineOffset: '-2px' } }),
  ] })
})
watch(() => props.modelValue, value => {
  // Не пересоздаём редактор при каждом вводе: сохраняем курсор и историю изменений.
  if (editor && value !== editor.state.doc.toString()) editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } })
})
onBeforeUnmount(() => editor?.destroy())
</script>
<template><div ref="host" class="min-w-0 overflow-hidden" /></template>
