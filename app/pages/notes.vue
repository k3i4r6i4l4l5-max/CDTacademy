<script setup lang="ts">
import type { NoteDefinition } from '../../shared/types/platform'

const { staff } = useAuth()
const { data: notes, error, refresh } = await useFetch<NoteDefinition[]>('/api/platform/notes', { query: { audience: 'student' } })
usePlatformSync(() => refresh())
const route = useRoute()
const router = useRouter()
const query = ref('')
const heading = ref<HTMLElement>()
const active = computed(() => notes.value?.find(note => note.id === route.query.id))
const visibleNotes = computed(() => (notes.value || [])
  .filter(note => note.title.toLocaleLowerCase().includes(query.value.trim().toLocaleLowerCase()))
  .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
)

async function selectNote(id?: string) {
  await router.push({ query: { id } })
  await nextTick()
  heading.value?.focus()
}
useHead({ title: computed(() => (active.value?.title || 'Конспекты') + ' — практика') })
</script>

<template>
  <main class="workspace-page workspace-page-medium">
    <header class="desk-header enter">
      <div class="min-w-0">
        <button v-if="active" class="desk-text-button mb-2" @click="selectNote()">← Все конспекты</button>
        <p v-else class="eyebrow">{{ staff ? 'Опубликованные материалы' : 'Материалы преподавателя' }}</p>
        <h1 ref="heading" tabindex="-1" class="page-title">{{ active?.title || 'Библиотека конспектов' }}</h1>
        <p class="desk-lead">{{ active ? 'Обновлён ' + new Date(active.updatedAt).toLocaleDateString('ru-RU') : 'Теория, разобранные примеры и пояснения к занятиям.' }}</p>
      </div>
      <NuxtLink v-if="!active" :to="staff ? '/admin?section=notes' : '/tests'" class="button-secondary">{{ staff ? 'К редактору конспектов' : 'К тестам' }} <span aria-hidden="true">→</span></NuxtLink>
    </header>
    <p v-if="error" role="alert" class="people-alert people-alert-error">Не удалось обновить конспекты. <button class="underline" @click="refresh()">Повторить</button></p>
    <p v-else-if="route.query.id && !active" role="status" class="people-alert people-alert-error">Этот конспект сейчас недоступен.</p>

    <div v-if="active" class="desk-surface note-reader">
      <TestNotes :text="active.body" />
    </div>
    <template v-else>
      <div v-if="notes?.length" class="desk-surface desk-filter mb-4">
        <label>Поиск по названию<input v-model="query" type="search" class="field mt-2" placeholder="Введите название конспекта"></label>
      </div>
      <div v-if="visibleNotes.length" class="desk-surface desk-list">
        <article v-for="note in visibleNotes" :key="note.id" class="desk-row">
          <div class="min-w-0">
            <h2 class="desk-row-title">{{ note.title }}</h2>
            <p class="desk-row-meta">Обновлён {{ new Date(note.updatedAt).toLocaleDateString('ru-RU') }}</p>
          </div>
          <button class="desk-text-button" @click="selectNote(note.id)">Читать конспект <span class="action-arrow" aria-hidden="true">→</span></button>
        </article>
      </div>
      <div v-else-if="!error" class="desk-surface desk-empty">
        <h2 class="desk-row-title">{{ query ? 'Конспекты не найдены' : 'Опубликованных конспектов пока нет' }}</h2>
        <p>{{ query ? 'Попробуйте изменить запрос.' : 'Здесь появятся материалы, когда преподаватель их опубликует.' }}</p>
      </div>
    </template>
  </main>
</template>
