export function attemptStatus(result: { pending: boolean; passed: boolean }) {
  if (result.pending) return { label: 'Ожидает проверки', tone: 'waiting' }
  return result.passed ? { label: 'Пройден', tone: 'good' } : { label: 'Не пройден', tone: 'bad' }
}
