export function platformError(error: unknown) {
  const e = error as { statusCode?: number; data?: { statusMessage?: string } }
  if (e.statusCode === 401) return 'Неверный логин или пароль либо сессия завершена. Войдите снова.'
  if (e.statusCode === 403) return 'Для этого действия недостаточно прав.'
  if (e.statusCode === 409) return 'Логин уже занят либо тест был изменён. Обновите данные и попробуйте снова.'
  if (e.statusCode === 400) return 'Проверьте поля: заполните вопросы, эталоны и варианты; баллы — от 1 до 100, порог — от 0 до 100. Все ответы обязательны.'
  return 'Не удалось выполнить действие. Проверьте соединение и повторите попытку.'
}
