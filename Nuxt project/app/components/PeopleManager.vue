<script setup lang="ts">
import type { PublicUser, StudentGroup } from '../../shared/types/platform'
import { roleNames } from '#shared/utils/platform'
const { user } = useAuth()
const isAdmin = computed(() => user.value?.role === 'admin')
const { data: students, refresh: refreshStudents } = await useFetch<PublicUser[]>('/api/platform/students')
const { data: groups } = await useFetch<StudentGroup[]>('/api/platform/groups')
const users = ref<PublicUser[]>([])
const choices = ref<Record<string, string>>({}), roles = ref<Record<string, string>>({})
// Выбор в строке — локальный черновик; сервер меняется только после нажатия «Сохранить».
const error = ref(''), success = ref(''), busy = ref(false)
const newAccount = reactive({ login: '', password: '', role: 'student', groupId: '' })
const showCreate = ref(false), query = ref('')
const matches = (account: PublicUser) => account.login.toLocaleLowerCase().includes(query.value.trim().toLocaleLowerCase())
const visibleStudents = computed(() => (students.value || []).filter(matches))
const visibleUsers = computed(() => users.value.filter(matches))
const groupName = (id: string | null) => groups.value?.find(group => group.id === id)?.name || 'Без группы'
function countLabel(count: number, one: string, few: string, many: string) {
  const form = new Intl.PluralRules('ru').select(count)
  return `${count} ${form === 'one' ? one : form === 'few' ? few : many}`
}
async function createAccount() {
  busy.value = true; error.value = ''; success.value = ''
  try { await $fetch<PublicUser>('/api/platform/users', {method:'POST',body:newAccount}); newAccount.login = ''; newAccount.password = ''; await loadUsers(); await refreshStudents(); showCreate.value = false; success.value = 'Учётная запись создана. Передайте пользователю назначенные логин, пароль и роль.' } catch(e) { error.value = platformError(e) } finally { busy.value = false }
}
async function loadUsers() { if (isAdmin.value) users.value = await $fetch<PublicUser[]>('/api/platform/users') }
await loadUsers()
usePlatformSync(() => Promise.all([refreshStudents(), loadUsers()]))
async function changeGroup(student: PublicUser) {
  busy.value = true; error.value = ''; success.value = ''
  try { await $fetch(`/api/platform/students/${student.id}/group`, { method: 'PATCH', body: { groupId: choices.value[student.id] ?? student.groupId } }); await refreshStudents(); success.value = 'Группа студента обновлена.' } catch(e) { error.value = platformError(e) } finally { busy.value = false }
}
async function changeRole(account: PublicUser) {
  busy.value = true; error.value = ''; success.value = ''
  try { await $fetch(`/api/platform/users/${account.id}/role`, { method: 'PATCH', body: { role: roles.value[account.id] ?? account.role } }); await loadUsers(); await refreshStudents(); success.value = 'Роль обновлена. Права применяются к следующему запросу пользователя.' } catch(e) { error.value = platformError(e) } finally { busy.value = false }
}
</script>
<template>
  <section class="people-workspace">
    <header class="people-heading">
      <div><span class="people-eyebrow">Учебное пространство</span><h2>Студенты и группы</h2><p>Помогайте учиться, объединяйте в группы и назначайте роли.</p><div class="people-summary"><span class="people-chip tone-student">{{ countLabel(students?.length || 0, 'студент', 'студента', 'студентов') }}</span><span class="people-chip tone-teacher">{{ countLabel(groups?.length || 0, 'учебная группа', 'учебные группы', 'учебных групп') }}</span><span v-if="isAdmin" class="people-chip tone-admin">{{ countLabel(users.filter(u => u.role === 'teacher').length, 'преподаватель', 'преподавателя', 'преподавателей') }}</span></div></div>
      <button v-if="isAdmin" class="button-primary" :aria-expanded="showCreate" aria-controls="create-account" @click="showCreate = !showCreate">{{ showCreate ? 'Закрыть форму' : 'Добавить пользователя' }} <span aria-hidden="true">{{ showCreate ? '−' : '+' }}</span></button>
    </header>
    <p v-if="error" role="alert" class="people-alert people-alert-error">{{ error }}</p><p v-if="success" role="status" class="people-alert people-alert-success">✓ {{ success }}</p>
    <section v-if="isAdmin && showCreate" id="create-account" class="people-create">
      <div class="people-create-intro"><span class="people-symbol" aria-hidden="true">+</span><h3>Новый участник</h3><p>Создайте аккаунт и передайте пользователю данные для входа.</p><span class="people-chip tone-admin">Доступ администратора</span></div>
      <form class="people-create-form" @submit.prevent="createAccount"><label>Назначенный логин<input v-model="newAccount.login" required maxlength="80" class="field mt-2" autocomplete="off" placeholder="Например, Студент 2"></label><label>Назначенный пароль<input v-model="newAccount.password" required minlength="3" maxlength="200" type="password" class="field mt-2" autocomplete="new-password" placeholder="От 3 символов"></label><label>Роль нового пользователя<select v-model="newAccount.role" class="field mt-2"><option value="student">Студент</option><option value="teacher">Преподаватель</option><option value="admin">Администратор</option></select></label><label v-if="newAccount.role === 'student'">Группа нового студента<select v-model="newAccount.groupId" class="field mt-2"><option value="">Без группы</option><option v-for="group in groups" :key="group.id" :value="group.id">{{ group.name }}</option></select></label><div class="people-form-actions"><button class="button-primary" :disabled="busy">{{ busy ? 'Создаём…' : 'Создать аккаунт' }}</button><button type="button" class="text-sm text-muted" :disabled="busy" @click="showCreate = false">Отмена</button></div></form>
    </section>
    <div class="people-toolbar"><label for="people-search" class="text-sm font-medium">Найти участника</label><input id="people-search" v-model="query" type="search" class="field" placeholder="Поиск по логину" autocomplete="off"><button v-if="query" class="text-xs text-accent" @click="query = ''">Сбросить</button></div>
    <div class="people-columns" :class="{ 'people-columns-admin': isAdmin }">
      <section class="people-section"><header class="people-section-heading people-section-green"><span class="people-section-mark tone-student" aria-hidden="true">Г</span><div><h3>Распределение по группам</h3><p>Выберите группу и сохраните изменение.</p></div><span class="people-count">{{ visibleStudents.length }}</span></header>
        <div v-for="student in visibleStudents" :key="student.id" class="people-student-row"><div class="people-person"><span class="people-avatar tone-student" aria-hidden="true">{{ student.login.charAt(0) }}</span><div><p class="people-name">{{ student.login }}</p><span class="people-group-label">{{ groupName(student.groupId) }}</span></div></div><div class="people-group-controls"><label class="sr-only" :for="`group-${student.id}`">Группа {{ student.login }}</label><select :id="`group-${student.id}`" :value="choices[student.id] ?? student.groupId ?? ''" class="field" @change="choices[student.id] = ($event.target as HTMLSelectElement).value"><option value="">Без группы</option><option v-for="group in groups" :key="group.id" :value="group.id">{{ group.name }}</option></select><button class="people-save people-save-green" :disabled="busy" @click="changeGroup(student)">Сохранить группу</button></div></div>
        <p v-if="!visibleStudents.length" class="people-empty">{{ query ? 'Студенты с таким логином не найдены.' : 'Студентов пока нет. Здесь появятся зарегистрированные участники.' }}</p>
        <div class="people-section-foot"><span class="people-status-dot" />Группу также может выбрать сам студент в профиле.</div>
      </section>
      <section v-if="isAdmin" class="people-section"><header class="people-section-heading people-section-peach"><span class="people-section-mark tone-admin" aria-hidden="true">Р</span><div><h3>Роли и доступ</h3><p>Назначайте преподавателей из списка участников.</p></div><span class="people-count">{{ visibleUsers.length }}</span></header>
        <div v-for="account in visibleUsers" :key="account.id" class="people-role-row"><div class="people-person"><span class="people-avatar" :class="`tone-${account.role}`" aria-hidden="true">{{ account.login.charAt(0) }}</span><div><p class="people-name">{{ account.login }}</p><span class="people-role-caption" :class="`role-text-${account.role}`">{{ roleNames[account.role] }}</span></div></div><span v-if="account.role === 'admin'" class="people-chip tone-admin">Администратор</span><div v-else class="people-role-controls"><select :value="roles[account.id] ?? account.role" class="field" :aria-label="`Роль ${account.login}`" @change="roles[account.id] = ($event.target as HTMLSelectElement).value"><option value="student">{{ roleNames.student }}</option><option value="teacher">{{ roleNames.teacher }}</option></select><button class="people-save" :disabled="busy" @click="changeRole(account)">Сохранить роль</button></div></div><p v-if="!visibleUsers.length" class="people-empty">Участники с таким логином не найдены.</p><p class="people-section-foot">Назначение ролей доступно только администратору.</p>
      </section>
    </div>
  </section>
</template>
