<script setup lang="ts">
import type { PublicUser, Role, StudentGroup } from '../../shared/types/platform'
import { roleNames } from '#shared/utils/platform'

const { user } = useAuth()
const isAdmin = computed(() => user.value?.role === 'admin')
const { data: accounts, error: loadError, refresh } = await useFetch<PublicUser[]>(() => isAdmin.value ? '/api/platform/users' : '/api/platform/students')
const { data: groups, error: groupsError, refresh: reloadGroups } = await useFetch<StudentGroup[]>('/api/platform/groups')
usePlatformSync(() => Promise.all([refresh(), reloadGroups()]))

const groupDrafts = ref<Record<string, string>>({})
const roleDrafts = ref<Record<string, string>>({})
const error = ref('')
const success = ref('')
const busy = ref(false)
const newAccount = reactive({ login: '', password: '', role: 'student' as Role, groupId: '' })
const showCreate = ref(false)
const createTitle = ref<HTMLElement>()
const query = ref('')
const filterRole = ref('')
const filterGroup = ref('all')
const visibleAccounts = computed(() => (accounts.value || []).filter(account =>
  account.login.toLocaleLowerCase().includes(query.value.trim().toLocaleLowerCase()) &&
  (!filterRole.value || account.role === filterRole.value) &&
  (filterGroup.value === 'all' || account.role === 'student' && (account.groupId || '') === filterGroup.value),
))
const groupName = (id: string | null) => groups.value?.find(group => group.id === id)?.name || 'Без группы'
const selectedGroup = (account: PublicUser) => groupDrafts.value[account.id] ?? account.groupId ?? ''
const selectedRole = (account: PublicUser) => roleDrafts.value[account.id] ?? account.role

function toggleCreate() {
  showCreate.value = !showCreate.value
  if (showCreate.value) nextTick(() => createTitle.value?.focus())
}
async function commit(action: () => Promise<void>, message: string) {
  if (busy.value) return
  busy.value = true
  error.value = ''
  success.value = ''
  try {
    await action()
    success.value = message
  } catch (e) {
    error.value = platformError(e)
  } finally {
    busy.value = false
  }
}
function replaceAccount(account: PublicUser) {
  accounts.value = (accounts.value || []).map(item => item.id === account.id ? account : item)
}
function createAccount() {
  return commit(async () => {
    const account = await $fetch<PublicUser>('/api/platform/users', { method: 'POST', body: newAccount })
    accounts.value = [...(accounts.value || []).filter(item => item.id !== account.id), account]
    Object.assign(newAccount, { login: '', password: '', role: 'student', groupId: '' })
    showCreate.value = false
    await refresh()
  }, 'Учётная запись создана. Передайте пользователю назначенные логин, пароль и роль.')
}
function changeGroup(account: PublicUser) {
  return commit(async () => {
    const updated = await $fetch<PublicUser>('/api/platform/students/' + account.id + '/group', { method: 'PATCH', body: { groupId: selectedGroup(account) } })
    delete groupDrafts.value[account.id]
    replaceAccount(updated)
    await refresh()
  }, 'Группа студента обновлена.')
}
function changeRole(account: PublicUser) {
  return commit(async () => {
    const updated = await $fetch<PublicUser>('/api/platform/users/' + account.id + '/role', { method: 'PATCH', body: { role: selectedRole(account) } })
    delete roleDrafts.value[account.id]
    delete groupDrafts.value[account.id]
    replaceAccount(updated)
    await refresh()
  }, 'Роль обновлена. Права применяются к следующему запросу пользователя.')
}
</script>

<template>
  <section aria-labelledby="people-title">
    <header class="desk-section-heading">
      <div><h2 id="people-title" class="desk-title">Студенты и группы</h2><p>{{ isAdmin ? 'Одна запись на участника. Здесь можно изменить его группу или роль.' : 'Найдите студента и назначьте ему учебную группу.' }}</p></div>
      <button v-if="isAdmin" class="button-primary" :aria-expanded="showCreate" :aria-controls="showCreate ? 'create-account' : undefined" :disabled="busy" @click="toggleCreate">
        {{ showCreate ? 'Закрыть форму' : 'Добавить пользователя' }} <span aria-hidden="true">{{ showCreate ? '−' : '+' }}</span>
      </button>
    </header>
    <p v-if="loadError || groupsError" role="alert" class="people-alert people-alert-error">Не удалось обновить список. <button class="underline" @click="refresh(); reloadGroups()">Повторить</button></p>
    <p v-if="error" role="alert" class="people-alert people-alert-error">{{ error }}</p>
    <p v-if="success" role="status" class="people-alert people-alert-success enter">{{ success }}</p>

    <section v-if="isAdmin && showCreate" id="create-account" class="desk-surface desk-form-section mb-4 enter">
      <h3 ref="createTitle" tabindex="-1" class="desk-title">Новый участник</h3>
      <p class="mb-4 text-sm text-muted">Создайте аккаунт и передайте участнику данные для входа.</p>
      <form class="desk-form" @submit.prevent="createAccount">
        <div class="grid gap-4 sm:grid-cols-2">
          <label>Назначенный логин<input v-model="newAccount.login" required maxlength="80" class="field mt-2" autocomplete="off"></label>
          <label>Назначенный пароль<input v-model="newAccount.password" required minlength="3" maxlength="200" type="password" class="field mt-2" autocomplete="new-password" placeholder="От 3 символов"></label>
          <label>Роль нового пользователя<select v-model="newAccount.role" class="field mt-2"><option v-for="(label, role) in roleNames" :key="role" :value="role">{{ label }}</option></select></label>
          <label v-if="newAccount.role === 'student'">Группа нового студента<select v-model="newAccount.groupId" class="field mt-2"><option value="">Без группы</option><option v-for="group in groups" :key="group.id" :value="group.id">{{ group.name }}</option></select></label>
        </div>
        <div class="desk-form-actions p-0"><button class="button-primary" :disabled="busy">{{ busy ? 'Создаём…' : 'Создать аккаунт' }}</button><button type="button" class="button-secondary" :disabled="busy" @click="toggleCreate">Отмена</button></div>
      </form>
    </section>

    <div class="desk-surface desk-filter mb-4">
      <label>Найти участника<input v-model="query" type="search" class="field mt-2" placeholder="Поиск по логину" autocomplete="off"></label>
      <label v-if="isAdmin">Фильтр по роли<select v-model="filterRole" class="field mt-2"><option value="">Все роли</option><option v-for="(label, role) in roleNames" :key="role" :value="role">{{ label }}</option></select></label>
      <label>Фильтр по группе<select v-model="filterGroup" class="field mt-2"><option value="all">Все группы</option><option value="">Без группы</option><option v-for="group in groups" :key="group.id" :value="group.id">{{ group.name }}</option></select></label>
    </div>

    <div v-if="visibleAccounts.length" class="desk-surface desk-list roster" :class="{ 'roster-admin': isAdmin }">
      <div class="roster-head roster-row" aria-hidden="true"><span>Участник</span><span>Учебная группа</span><span v-if="isAdmin">Роль и доступ</span></div>
      <div v-for="account in visibleAccounts" :key="account.id" class="roster-row" :class="{ 'people-role-row': isAdmin }">
        <div class="flex min-w-0 items-center gap-3">
          <span class="workspace-avatar" aria-hidden="true">{{ account.login.charAt(0) }}</span>
          <div class="min-w-0"><p class="desk-row-title">{{ account.login }}</p><p class="desk-row-meta">{{ account.role === 'student' ? groupName(account.groupId) : roleNames[account.role] }}</p></div>
        </div>
        <div v-if="account.role === 'student'" class="roster-control">
          <label class="sr-only" :for="'group-' + account.id">Группа {{ account.login }}</label>
          <select :id="'group-' + account.id" :value="selectedGroup(account)" :disabled="busy || Boolean(groupsError)" class="field" @change="groupDrafts[account.id] = ($event.target as HTMLSelectElement).value">
            <option value="">Без группы</option><option v-for="group in groups" :key="group.id" :value="group.id">{{ group.name }}</option>
          </select>
          <button class="button-secondary" :disabled="busy || selectedGroup(account) === (account.groupId || '')" @click="changeGroup(account)">Сохранить группу</button>
        </div>
        <span v-else class="text-xs text-muted roster-no-group">—</span>
        <template v-if="isAdmin">
          <div v-if="account.role !== 'admin'" class="roster-control">
            <select :value="selectedRole(account)" :aria-label="'Роль ' + account.login" :disabled="busy" class="field" @change="roleDrafts[account.id] = ($event.target as HTMLSelectElement).value">
              <option value="student">{{ roleNames.student }}</option><option value="teacher">{{ roleNames.teacher }}</option>
            </select>
            <button class="button-secondary" :disabled="busy || selectedRole(account) === account.role" @click="changeRole(account)">Сохранить роль</button>
          </div>
          <span v-else class="desk-chip">Полный доступ</span>
        </template>
      </div>
    </div>
    <div v-else-if="!loadError" class="desk-surface desk-empty"><h3>Участники не найдены</h3><p>{{ query || filterRole || filterGroup !== 'all' ? 'Попробуйте изменить запрос или фильтры.' : 'Список заполнится после регистрации участников.' }}</p></div>
    <p v-if="visibleAccounts.length" class="mt-3 text-xs text-muted">Показано {{ visibleAccounts.length }} из {{ accounts?.length ?? 0 }}</p>
  </section>
</template>
