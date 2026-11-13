import type { PublicUser } from '../../shared/types/platform'
export function useAuth() {
  // Общее состояние сессии для меню и страниц; при SSR запрос сохраняет cookie пользователя.
  const user = useState<PublicUser | null>('auth-user', () => null)
  const request = useRequestFetch()
  async function refresh() {
    const previousUser = user.value
    const result = await request<{ user: PublicUser | null }>('/api/platform/me')
    // Запоздалый ответ не должен перезаписать выход или сохранённые изменения профиля.
    if (user.value === previousUser) user.value = result.user
  }
  const staff = computed(() => user.value?.role === 'admin' || user.value?.role === 'teacher')
  async function logout() { await $fetch('/api/platform/logout', { method: 'POST' }); user.value = null; await navigateTo('/') }
  return { user, staff, refresh, logout }
}
