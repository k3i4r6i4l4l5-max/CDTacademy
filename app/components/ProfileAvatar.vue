<script setup lang="ts">
import type { PublicUser } from '#shared/types/platform'

defineProps<{ user: PublicUser }>()
const failedUrl = ref('')
</script>

<template>
  <span class="workspace-avatar" aria-hidden="true">
    <img v-if="user.avatarUrl && user.avatarUrl !== failedUrl" :key="user.avatarUrl" :src="user.avatarUrl" alt="" @error="failedUrl = user.avatarUrl || ''">
    <template v-else>{{ Array.from(user.login)[0]?.toLocaleUpperCase() }}</template>
  </span>
</template>
