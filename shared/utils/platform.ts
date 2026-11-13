import type { Role, Submission } from '../types/platform'
export const roleNames: Record<Role, string> = { student: 'Студент', teacher: 'Преподаватель', admin: 'Администратор' }
// Общий расчёт для студента, панели и аналитики: ручные ответы должны быть оценены до прохождения.
export function resultOf(submission: Submission) {
  const max = submission.answers.reduce((n, a) => n + a.question.points, 0)
  const earned = submission.answers.reduce((n, a) => n + (a.points ?? 0), 0)
  const pending = submission.answers.some(a => a.points === null)
  const percent = max ? Math.round(earned / max * 10000) / 100 : 0
  // Порог сравниваем без округления, чтобы округлённые 60% не засчитали результат ниже 60%.
  return { max, earned, pending, percent, passed: !pending && max > 0 && earned * 100 >= submission.passPercent * max }
}
