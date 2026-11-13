<script setup lang="ts">
import { roleNames } from '#shared/utils/platform'

const { user, staff, refresh, logout } = useAuth()
const route = useRoute()
const opened = ref(false)
const error = ref('')
const trigger = ref<HTMLButtonElement>()
const learningLinks = [
  { to: '/', label: 'Главная', icon: 'home' },
  { to: '/learn', label: 'Обучение', icon: 'learn' },
  { to: '/tests', label: 'Тесты', icon: 'tests' },
  { to: '/notes', label: 'Конспекты', icon: 'notes' },
]
const links = computed(() => staff.value ? [
  { to: '/admin', label: 'Управление', icon: 'staff' },
  ...learningLinks.slice(1),
] : learningLinks)

onMounted(() => refresh().catch(() => {}))
usePlatformSync(() => refresh())
watch(() => route.fullPath, () => { opened.value = false })

function closeOnBlur(event: FocusEvent) {
  if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) {
    opened.value = false
  }
}

function closeOnEscape() {
  if (!opened.value) return
  opened.value = false
  trigger.value?.focus()
}

async function exit() {
  error.value = ''
  try {
    await logout()
    opened.value = false
  } catch {
    error.value = 'Не удалось выйти. Попробуйте снова.'
  }
}
</script>

<template>
  <header class="workspace-rail">
    <NuxtLink to="/" class="workspace-brand"><span class="reference-brand-mark" aria-hidden="true">п.</span>практика</NuxtLink>

    <nav class="workspace-nav" aria-label="Основная навигация">
      <NuxtLink v-for="link in links" :key="link.to" :to="link.to">
        <span class="nav-icon" :class="'nav-icon-' + link.icon" aria-hidden="true" />
        {{ link.label }}
      </NuxtLink>
    </nav>
  </header>
  <div class="workspace-account">
    <div class="workspace-account-controls" @focusout="closeOnBlur" @keydown.esc="closeOnEscape">
      <button
        v-if="user" ref="trigger" type="button" class="workspace-account-button"
        :aria-expanded="opened" :aria-controls="opened ? 'account-menu' : undefined"
        aria-label="Личный кабинет" @click="opened = !opened"
      >
        <ProfileAvatar :user="user" />
        <span>Личный<br>кабинет</span>
      </button>
      <NuxtLink v-else to="/login" class="button-secondary">Войти</NuxtLink>
      <Transition name="popover">
        <div v-if="opened && user" id="account-menu" class="workspace-popover">
          <p class="break-words px-2 pt-1 text-sm font-medium">{{ user.login }}</p>
          <p class="px-2 pt-1 text-xs text-muted">{{ roleNames[user.role] }}</p>
          <NuxtLink to="/profile">{{ staff ? 'Мой профиль' : 'Мой профиль и группа' }}</NuxtLink>
          <NuxtLink v-if="staff" to="/admin">Управление обучением</NuxtLink>
          <button type="button" @click="exit">Выйти</button>
          <p v-if="error" role="alert" class="px-2 py-1 text-xs text-accent">{{ error }}</p>
        </div>
      </Transition>
    </div>
  </div>
</template>
