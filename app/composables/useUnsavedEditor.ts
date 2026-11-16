export function useUnsavedEditor(dirty: Ref<boolean>) {
  function canDiscard() {
    return !dirty.value || window.confirm('Уйти без сохранения изменений?')
  }
  function beforeUnload(event: BeforeUnloadEvent) {
    if (!dirty.value) return
    event.preventDefault()
    event.returnValue = ''
  }
  onBeforeRouteLeave(canDiscard)
  onBeforeRouteUpdate(canDiscard)
  onMounted(() => window.addEventListener('beforeunload', beforeUnload))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))
  return canDiscard
}
