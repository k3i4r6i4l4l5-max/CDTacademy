export default defineNuxtRouteMiddleware(async to => {
  if (to.path === '/' || to.path === '/lessons') {
    if (import.meta.server && !import.meta.prerender) await useAuth().refresh().catch(() => {})
    return
  }
  // Здесь управляем переходами; независимая проверка прав выполняется в серверном API.
  if (!to.path.startsWith('/admin') && !to.path.startsWith('/tests') && !to.path.startsWith('/notes') && to.path !== '/profile') return
  const { user, staff, refresh } = useAuth()
  const previousRole = user.value?.role
  try {
    await refresh()
  } catch {
    return abortNavigation(createError({
      statusCode: 503,
      statusMessage: 'Session check unavailable',
      message: 'Не удалось проверить сессию. Обновите страницу и попробуйте снова.',
    }))
  }
  if (!user.value) return navigateTo({ path: '/login', query: { next: to.fullPath, role: previousRole } })
  if (to.path.startsWith('/admin') && !staff.value) return navigateTo('/tests')
})
