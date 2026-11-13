<script setup lang="ts">
import type { PublicUser, Role, StudentGroup } from '../../shared/types/platform'
definePageMeta({ layout: false })
const { user } = useAuth()
const route = useRoute()
const register = ref(route.query.register === '1')
const role = ref<Role>('student')
const login = ref(''), password = ref('')
const repeatPassword = ref(''), groupId = ref('')
const { data: groups } = await useFetch<StudentGroup[]>('/api/platform/groups')
const error = ref(''), busy = ref(false)
const showPassword = ref(false)
function changeMode(value: boolean) { if (register.value === value) return; register.value = value; if (value) role.value = 'student'; password.value = ''; repeatPassword.value = ''; showPassword.value = false; error.value = '' }
watch(role, () => { error.value = '' })
async function submit() {
  if (busy.value) return
  error.value = ''
  if (register.value && password.value !== repeatPassword.value) { error.value = 'Пароли не совпадают.'; return }
  busy.value = true
  try {
    const result = await $fetch<{ user: PublicUser }>(register.value ? '/api/platform/register' : '/api/platform/login', { method: 'POST', body: { login: login.value, password: password.value, role: register.value ? 'student' : role.value, groupId: groupId.value } })
    user.value = result.user
    await navigateTo(result.user.role === 'student' ? '/tests' : '/admin')
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode
    if (status === 401) error.value = 'Неверный логин или пароль. Проверьте язык клавиатуры и регистр символов.'
    else if (status === 403) error.value = register.value ? 'Регистрация доступна только студентам.' : 'Выбранная роль не соответствует аккаунту. Укажите свою роль.'
    else if (status === 409) error.value = 'Этот логин уже занят. Выберите другой логин или перейдите ко входу.'
    else if (status === 400) error.value = 'Проверьте логин, пароль (от 3 до 200 символов) и выбранную группу.'
    else error.value = platformError(e)
  } finally { busy.value = false }
}
useHead({ title: computed(() => register.value ? 'Регистрация — практика' : 'Вход — практика'), htmlAttrs: {lang:'ru'} })
</script>

<template>
  <main class="auth-shell">
    <NuxtLink to="/" class="auth-brand"><span class="reference-brand-mark" aria-hidden="true">п.</span><span>практика</span></NuxtLink>
    <div class="auth-layout">
      <section class="auth-intro enter" aria-label="О платформе">
        <p class="auth-display">Ваше пространство для учёбы</p>
        <p>Открывайте материалы преподавателей, выполняйте задания и следите за своими результатами.</p>
        <NuxtLink to="/learn" class="progress-link">Открыть курс JavaScript <span class="action-arrow" aria-hidden="true">→</span></NuxtLink>
      </section>
      <section class="auth-card enter" aria-labelledby="auth-title">
        <div class="auth-tabs" :class="register ? 'show-register' : 'show-login'" role="group" aria-label="Способ входа"><button type="button" :class="{active:!register}" :aria-pressed="!register" :disabled="busy" @click="changeMode(false)">Войти</button><button type="button" :class="{active:register}" :aria-pressed="register" :disabled="busy" @click="changeMode(true)">Зарегистрироваться</button></div>
        <div :key="String(register)" class="auth-heading enter"><h1 id="auth-title">{{ register ? 'Создайте аккаунт' : 'С возвращением' }}</h1><p>{{ register ? 'Зарегистрируйтесь, чтобы проходить тесты преподавателя.' : 'Выберите роль и войдите в свой аккаунт.' }}</p></div>
        <form class="auth-form" @submit.prevent="submit">
          <label v-if="!register">Тип аккаунта<select v-model="role" :disabled="busy"><option value="teacher">Преподаватель</option><option value="student">Студент</option><option value="admin">Администратор</option></select></label>
          <p v-if="register" class="auth-role-note">Самостоятельная регистрация доступна только студентам. Аккаунты преподавателей и администраторов создаёт администратор.</p>
          <div class="contents">
            <label>Логин<input v-model="login" required maxlength="80" autocomplete="username" placeholder="Введите логин" :disabled="busy"></label>
            <div><label for="auth-password" class="mb-2">Пароль</label><div class="auth-password-field"><input id="auth-password" v-model="password" required minlength="3" maxlength="200" :type="showPassword ? 'text' : 'password'" :autocomplete="register ? 'new-password' : 'current-password'" placeholder="Не менее 3 символов" :disabled="busy"><button type="button" :aria-label="showPassword ? 'Скрыть пароль' : 'Показать пароль'" :aria-pressed="showPassword" @click="showPassword = !showPassword">{{ showPassword ? 'Скрыть' : 'Показать' }}</button></div></div>
          </div>
          <template v-if="register"><label>Повторите пароль<input v-model="repeatPassword" required type="password" minlength="3" maxlength="200" autocomplete="new-password" placeholder="Введите пароль ещё раз" :disabled="busy"></label><label>Учебная группа<select v-model="groupId" :disabled="busy"><option value="">Выберу позже</option><option v-for="group in groups" :key="group.id" :value="group.id">{{ group.name }}</option></select></label></template>
          <p v-if="error" class="auth-error enter" role="alert">{{ error }}</p><button class="button-primary auth-submit" type="submit" :disabled="busy">{{ busy ? 'Подождите…' : register ? 'Зарегистрироваться' : 'Войти' }} <span v-if="!busy" class="action-arrow" aria-hidden="true">→</span></button>
        </form>
      </section>
    </div>
  </main>
</template>
