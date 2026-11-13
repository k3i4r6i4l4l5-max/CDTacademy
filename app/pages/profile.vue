<script setup lang="ts">
import { roleNames } from '#shared/utils/platform'
import { avatarTypes, avatarUploadLimit } from '#shared/utils/avatar'
import type { PublicUser, StudentGroup } from '../../shared/types/platform'

const { user } = useAuth()
const isStudent = computed(() => user.value?.role === 'student')
const { data: groups, error: groupsError, refresh: reloadGroups } = await useFetch<StudentGroup[]>('/api/platform/groups')
const groupId = ref(user.value?.groupId || '')
const currentGroup = computed(() => groups.value?.find(group => group.id === user.value?.groupId)?.name)
const dirty = computed(() => groupId.value !== (user.value?.groupId || ''))
watch(() => user.value?.groupId, (next, previous) => {
  if (groupId.value === (previous || '')) groupId.value = next || ''
})
const message = ref('')
const error = ref('')
const busy = ref(false)
const avatarInput = ref<HTMLInputElement>()
const avatarBusy = ref(false)
const avatarMessage = ref('')
const avatarError = ref('')

async function saveAvatar(file: File | null) {
  const accountId = user.value?.id
  if (!accountId || busy.value || avatarBusy.value) return
  avatarMessage.value = ''
  avatarError.value = ''
  if (file && (!avatarTypes.includes(file.type) || !file.size || file.size > avatarUploadLimit)) {
    avatarError.value = 'Выберите изображение PNG, JPEG или WebP размером до 5 МБ.'
    return
  }
  avatarBusy.value = true
  try {
    let avatar: string | null = null
    if (file) {
      try {
        avatar = await prepareAvatar(file)
      } catch {
        avatarError.value = 'Не удалось открыть изображение. Выберите другой файл.'
        return
      }
    }
    if (user.value?.id !== accountId) return
    const result = await $fetch<{ user: PublicUser }>('/api/platform/me/avatar', { method: 'PATCH', body: { avatar } })
    if (user.value?.id === accountId) {
      user.value = result.user
      avatarMessage.value = file ? 'Аватар обновлён.' : 'Аватар удалён.'
    }
  } catch {
    avatarError.value = 'Не удалось сохранить аватар. Попробуйте ещё раз.'
  } finally {
    avatarBusy.value = false
  }
}
function selectAvatar(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) void saveAvatar(file)
}

async function save() {
  if (busy.value || avatarBusy.value || !dirty.value) return
  busy.value = true
  error.value = ''
  message.value = ''
  try {
    const result = await $fetch<{ user: PublicUser }>('/api/platform/me/group', { method: 'PATCH', body: { groupId: groupId.value } })
    user.value = result.user
    groupId.value = result.user.groupId || ''
    message.value = 'Группа сохранена.'
  } catch (e) {
    error.value = platformError(e)
  } finally {
    busy.value = false
  }
}
useHead({ title: 'Мой профиль — практика' })
</script>

<template>
  <main class="workspace-page workspace-page-narrow">
    <header class="desk-header enter">
      <div><p class="eyebrow">Личный кабинет</p><h1 class="page-title">Мой профиль</h1></div>
      <NuxtLink :to="isStudent ? '/tests' : '/admin'" class="button-secondary">{{ isStudent ? 'К заданиям' : 'К управлению' }} <span aria-hidden="true">→</span></NuxtLink>
    </header>

    <section v-if="user" class="desk-surface" aria-label="Учётная запись">
      <div class="desk-row desk-row-identity">
        <ProfileAvatar :user="user" class="profile-avatar" />
        <div class="min-w-0"><h2 class="desk-title">{{ user.login }}</h2><p class="desk-row-meta"><span class="desk-chip">{{ roleNames[user.role] }}</span></p></div>
      </div>
      <div class="desk-detail-body">
        <div class="flex flex-wrap items-center gap-2">
          <input ref="avatarInput" id="avatar-upload" hidden type="file" aria-label="Файл аватара" :accept="avatarTypes.join(',')" @change="selectAvatar">
          <button type="button" class="button-secondary" :disabled="busy || avatarBusy" @click="avatarInput?.click()">
            {{ avatarBusy ? 'Сохраняем…' : user.avatarUrl ? 'Сменить аватар' : 'Загрузить аватар' }}
          </button>
          <button v-if="user.avatarUrl" type="button" class="desk-text-button" :disabled="busy || avatarBusy" @click="saveAvatar(null)">Удалить аватар</button>
        </div>
        <p class="mt-2 text-xs text-muted">PNG, JPEG или WebP до 5 МБ.</p>
        <p v-if="avatarMessage" role="status" class="mt-2 text-sm text-success">{{ avatarMessage }}</p>
        <p v-if="avatarError" role="alert" class="mt-2 text-sm text-accent">{{ avatarError }}</p>
      </div>
    </section>

    <section v-if="isStudent" class="desk-section" aria-labelledby="student-group">
      <header class="desk-section-heading">
        <div><h2 id="student-group" class="desk-title">Учебная группа</h2><p>Текущая группа: {{ groupsError ? 'не удалось загрузить' : currentGroup || 'без группы' }}.</p></div>
      </header>
      <p v-if="groupsError" role="alert" class="people-alert people-alert-error">Не удалось загрузить группы. <button class="underline" @click="reloadGroups()">Повторить</button></p>
      <form class="desk-surface desk-form-section desk-form" @submit.prevent="save">
        <div>
          <label for="profile-group">Выберите группу</label>
          <select id="profile-group" v-model="groupId" class="field mt-2 max-w-sm" :disabled="busy || Boolean(groupsError)" @change="message = ''; error = ''">
            <option value="">Без группы</option>
            <option v-for="group in groups" :key="group.id" :value="group.id">{{ group.name }}</option>
          </select>
        </div>
        <div class="desk-form-actions p-0">
          <button class="button-primary" :disabled="busy || avatarBusy || !dirty || Boolean(groupsError)">{{ busy ? 'Сохраняем…' : 'Сохранить группу' }}</button>
          <p v-if="message" role="status" class="enter text-sm text-success">{{ message }}</p>
          <p v-if="error" role="alert" class="text-sm text-accent">{{ error }}</p>
        </div>
      </form>
    </section>

    <section v-else class="desk-section" aria-labelledby="profile-access">
      <header class="desk-section-heading"><h2 id="profile-access" class="desk-title">Рабочие разделы</h2></header>
      <div class="desk-surface desk-list">
        <NuxtLink to="/admin?section=tests" class="desk-row"><span class="desk-row-title">Редактор тестов</span><span class="action-arrow text-accent" aria-hidden="true">→</span></NuxtLink>
        <NuxtLink to="/admin?section=answers" class="desk-row"><span class="desk-row-title">Ответы и результаты</span><span class="action-arrow text-accent" aria-hidden="true">→</span></NuxtLink>
        <NuxtLink v-if="user?.role === 'admin'" to="/admin?section=analytics" class="desk-row"><span class="desk-row-title">Общая аналитика</span><span class="action-arrow text-accent" aria-hidden="true">→</span></NuxtLink>
      </div>
    </section>
  </main>
</template>
