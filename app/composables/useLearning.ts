import { lessons } from '~/data/course'
import type { Answer } from '../../shared/types/course'

const KEY = 'practice:javascript:v2'
const exerciseIds = new Set(lessons.flatMap(lesson => [
  ...lesson.theory.map(section => `${lesson.id}:${section.practice.id}`),
  `${lesson.id}:code`,
]))

// Прогресс встроенного курса хранится в браузере отдельно от серверных попыток тестов.
export function useLearning() {
  const answers = useState<Record<string, Answer>>('learning-answers', () => ({}))
  const selected = useState('learning-lesson', () => lessons[0]!.id)
  const ready = useState('learning-ready', () => false)
  const storageError = useState('learning-storage-error', () => '')
  onMounted(() => {
    // Восстанавливаем из localStorage только известные задания и корректные поля.
    if (ready.value) return
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || 'null')
      if (data && typeof data === 'object') {
        if (lessons.some(l => l.id === data.selected)) selected.value = data.selected
        if (data.answers && typeof data.answers === 'object') {
          for (const [key, value] of Object.entries(data.answers)) {
            const a = value as Partial<Answer> | null
            if (exerciseIds.has(key) && a && typeof a.value === 'string' && typeof a.passed === 'boolean' && typeof a.feedback === 'string') answers.value[key] = a as Answer
          }
        }
      }
    } catch { storageError.value = 'Сохранённые данные недоступны. Вы можете продолжить в этой вкладке.' }
    ready.value = true
  })
  watch([answers, selected], () => {
    if (!ready.value) return
    try {
      localStorage.setItem(KEY, JSON.stringify({ answers: answers.value, selected: selected.value }))
      storageError.value = ''
    } catch { storageError.value = 'Не удалось сохранить ответы в браузере. Не закрывайте вкладку.' }
  }, { deep: true, flush: 'sync' })
  const isComplete = (id: string) => {
    const l = lessons.find(item => item.id === id)!
    return l.theory.every(t => answers.value[`${id}:${t.practice.id}`]?.passed) && Boolean(answers.value[`${id}:code`]?.passed)
  }
  const completed = computed(() => lessons.filter(l => isComplete(l.id)).length)
  const solved = computed(() => [...exerciseIds].filter(id => answers.value[id]?.passed).length)
  function save(id: string, value: string, passed = false, feedback = '') { answers.value[id] = { value, passed, feedback } }
  return { answers, selected, ready, storageError, completed, solved, totalExercises: exerciseIds.size, isComplete, save }
}
