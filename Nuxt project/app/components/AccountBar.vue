<script setup lang="ts">
import { roleNames } from '#shared/utils/platform'
const { user, staff, refresh, logout } = useAuth()
const route = useRoute()
const opened = ref(false), error = ref('')
onMounted(() => refresh().catch(() => {}))
usePlatformSync(() => refresh())
watch(() => route.fullPath, () => { opened.value = false })
const active = computed(() => route.path.startsWith('/admin') || route.path.startsWith('/tests') ? 2 : route.path.startsWith('/learn') ? 1 : 0)
async function exit() { try { await logout(); opened.value = false } catch { error.value = 'Не удалось выйти. Попробуйте снова.' } }
</script>
<template>
  <header class="reference-navbar"><div class="reference-nav-inner">
    <NuxtLink to="/" class="reference-brand"><span class="reference-brand-mark" aria-hidden="true">п.</span>практика</NuxtLink>
    <nav class="reference-nav-switch" aria-label="Основная навигация"><span class="reference-nav-indicator" :style="{ transform: `translateX(${active * 100}%)` }" /><NuxtLink to="/" :class="{active:active===0}">Главная</NuxtLink><NuxtLink to="/learn" :class="{active:active===1}">Обучение</NuxtLink><NuxtLink :to="staff ? '/admin' : '/tests'" :class="{active:active===2}">{{ staff ? 'Управление' : 'Тесты' }}</NuxtLink></nav>
    <div class="reference-profile"><button v-if="user" class="reference-profile-button" :aria-expanded="opened" @click="opened = !opened"><span class="reference-avatar">{{ user.login.charAt(0) }}</span><span class="reference-profile-label">Личный кабинет</span></button><NuxtLink v-else to="/login" class="reference-profile-button"><span class="reference-avatar">п.</span><span>Войти</span></NuxtLink>
      <div v-if="opened && user" class="reference-popover"><p class="text-sm font-medium">{{ user.login }}</p><p class="mt-1 mb-4 text-xs text-muted">{{ roleNames[user.role] }}</p><NuxtLink to="/notes" class="block py-2 text-sm">Конспекты</NuxtLink><NuxtLink to="/profile" class="block py-2 text-sm">Мой профиль и группа</NuxtLink><NuxtLink v-if="staff" to="/admin" class="block py-2 text-sm">Панель преподавателя</NuxtLink><button class="mt-3 text-sm text-accent" @click="exit">Выйти</button><p v-if="error" role="alert" class="mt-3 text-xs text-accent">{{ error }}</p></div>
    </div>
  </div></header>
</template>
