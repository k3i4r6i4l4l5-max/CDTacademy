<script setup lang="ts">
import type { PublicUser, StudentGroup } from '../../shared/types/platform'
const { user } = useAuth()
const { data: groups } = await useFetch<StudentGroup[]>('/api/platform/groups')
const groupId = ref(user.value?.groupId || '')
watch(() => user.value?.groupId, (next, previous) => {
  // Применяем смену группы преподавателем, если студент сам ещё не редактирует выбор.
  if ((groupId.value || null) === (previous || null)) groupId.value = next || ''
})
const message = ref(''), error = ref(''), busy = ref(false)
async function save() {
  busy.value = true; error.value = ''; message.value = ''
  try { user.value = (await $fetch<{user:PublicUser}>('/api/platform/me/group', {method:'PATCH',body:{groupId:groupId.value}})).user; message.value = 'Группа сохранена.' } catch(e) { error.value = platformError(e) } finally { busy.value = false }
}
</script>
<template><main class="mx-auto max-w-3xl px-5 py-14"><p class="eyebrow">Личное пространство</p><h1 class="page-title mt-4">{{ user?.login }}</h1><section v-if="user?.role === 'student'" class="panel mt-8"><h2 class="text-xl">Моя группа</h2><form class="mt-5 space-y-4" @submit.prevent="save"><label class="block text-sm">Учебная группа<select v-model="groupId" class="field mt-2"><option value="">Без группы</option><option v-for="group in groups" :key="group.id" :value="group.id">{{ group.name }}</option></select></label><button class="button-primary" :disabled="busy">Сохранить группу</button><p v-if="message" role="status" class="text-sm text-success">{{ message }}</p><p v-if="error" role="alert" class="text-sm text-accent">{{ error }}</p></form></section><NuxtLink v-else to="/admin" class="button-primary mt-8">Управление обучением →</NuxtLink></main></template>
