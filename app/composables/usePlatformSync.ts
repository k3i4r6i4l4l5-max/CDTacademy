/** Обновляет данные видимой страницы; редактируемые черновики остаются в компонентах. */
export function usePlatformSync(refresh: () => Promise<unknown>) {
  const { user } = useAuth()
  let timer: ReturnType<typeof setInterval> | undefined
  let running = false, disposed = false
  async function sync() {
    if (disposed || running || document.visibilityState === 'hidden' || !user.value) return
    running = true
    try { await refresh() } catch { /* Ошибка доступна странице через useFetch; следующий опрос повторит запрос. */ } finally { running = false }
  }
  onMounted(() => {
    timer = setInterval(sync, 5000)
    window.addEventListener('focus', sync)
    document.addEventListener('visibilitychange', sync)
    window.addEventListener('platform:changed', sync)
  })
  onBeforeUnmount(() => {
    disposed = true; clearInterval(timer)
    window.removeEventListener('focus', sync)
    document.removeEventListener('visibilitychange', sync)
    window.removeEventListener('platform:changed', sync)
  })
}
