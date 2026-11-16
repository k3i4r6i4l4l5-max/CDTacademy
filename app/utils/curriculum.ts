import type { CurriculumPlacement } from '#shared/types/platform'

export function placementLabel(placement?: CurriculumPlacement) {
  return placement ? [placement.subject, placement.course, placement.module].filter(Boolean).join(' / ') : ''
}

export function subjectOf(item: { placement?: CurriculumPlacement }) {
  return item.placement?.subject || ''
}

export function subjectOptions(items: { placement?: CurriculumPlacement }[]) {
  return [...new Set(items.map(subjectOf).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru'))
}

export function lessonModule(index: number) {
  if (index < 4) return 'Основы языка'
  if (index < 6) return 'Циклы и функции'
  return 'Работа с данными'
}
