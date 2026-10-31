export default defineNuxtRouteMiddleware(async to => {
  // Здесь управляем переходами; независимая проверка прав выполняется в серверном API.
  if (!to.path.startsWith('/admin') && !to.path.startsWith('/tests') && !to.path.startsWith('/notes') && to.path !== '/profile') return
  const { user, staff, refresh } = useAuth()
  try { await refresh() } catch { return navigateTo('/login') }
  if (!user.value) return navigateTo('/login')
  if (to.path.startsWith('/admin') && !staff.value) return navigateTo('/tests')
})
