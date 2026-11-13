import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from 'node:crypto'
import { mkdirSync, readFileSync, existsSync, writeFileSync, renameSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import type { PublicUser, Submission, TestDefinition, StudentGroup, NoteDefinition } from '../../shared/types/platform'

interface User extends PublicUser {
  password: string
  avatar?: { type: string; data: string; version: string }
}
interface Database { users: User[]; groups: StudentGroup[]; notes: NoteDefinition[]; sessions: { token: string; userId: string; expires: number }[]; tests: TestDefinition[]; submissions: Submission[] }
const file = resolve(process.env.PLATFORM_DATA_FILE || '.data/platform.json')
// Исходный пароль не сохраняется: в файл записываются только соль и хеш.
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
}
export function passwordMatches(password: string, hash: string) {
  const [salt, value] = hash.split(':')
  return Boolean(salt && value && timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(value, 'hex')))
}
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex')
// Отбираем публичные поля, чтобы не передать клиенту хеш пароля.
export const publicUser = ({ id, login, role, groupId }: PublicUser): PublicUser => ({ id, login, role, groupId: groupId ?? null })
export function sessionUser(user: User): PublicUser {
  return {
    ...publicUser(user),
    ...(user.avatar ? { avatarUrl: '/api/platform/me/avatar?v=' + user.avatar.version } : {}),
  }
}
export function saveDatabase(db: Database) {
  mkdirSync(dirname(file), { recursive: true })
  // Сначала записываем целый файл, затем атомарно заменяем предыдущую версию.
  writeFileSync(`${file}.tmp`, JSON.stringify(db, null, 2), { mode: 0o600 })
  renameSync(`${file}.tmp`, file)
}
export function database(): Database {
  if (existsSync(file)) {
    // Дополняем старую схему без сброса пользователей и результатов.
    const db: Database = JSON.parse(readFileSync(file, 'utf8'))
    if (!db.notes) { db.notes = []; saveDatabase(db) }
    if (!db.groups) { db.groups = defaultGroups(); for (const user of db.users) user.groupId ??= null; saveDatabase(db) }
    return db
  }
  // Начальные аккаунты создаются только при отсутствии рабочего файла данных.
  const db: Database = {
    users: [
      { id: randomUUID(), login: 'Студент 1', role: 'student', groupId: 'is-11', password: hashPassword('123') },
      { id: randomUUID(), login: 'Препод 1', role: 'teacher', groupId: null, password: hashPassword('Препод 1') },
      { id: randomUUID(), login: 'Админ', role: 'admin', groupId: null, password: hashPassword('Админ123') },
    ], groups: defaultGroups(), notes: [], sessions: [], submissions: [], tests: [{
      id: 'arrays-basics', title: 'Массивы: первые шаги', notes: 'Массив хранит элементы по порядку. Индексация начинается с нуля.\n\nconst values = [10, 20, 30];\nvalues[0]; // 10\nvalues.at(-1); // 30\n\nМетод push меняет массив и возвращает новую длину. Метод map создаёт новый массив из результатов функции.\n\nПример похожей реализации:\nfunction double(values) {\n  return values.map(value => value * 2);\n}',
      passPercent: 60, published: true, updatedAt: new Date().toISOString(), questions: [
        { id: 'q1', prompt: 'С какого индекса начинается массив? Введите число.', type: 'text', options: [], expected: '0', points: 1 },
        { id: 'q2', prompt: 'Что возвращает push?', type: 'choice', options: ['Новый массив', 'Новую длину', 'Удалённый элемент'], expected: 'Новую длину', points: 1 },
        { id: 'q3', prompt: 'Объясните своими словами разницу между map и forEach. Приведите пример применения.', type: 'free', options: [], expected: '', points: 2 },
        { id: 'q4', prompt: 'Напишите triple(values), которая возвращает новый массив с утроенными числами. Исходный массив не меняйте.', type: 'code', options: [], expected: '', points: 2 },
      ],
    }],
  }
  saveDatabase(db)
  return db
}
function defaultGroups(): StudentGroup[] { return [{ id: 'is-11', name: 'ИС-11' }, { id: 'is-12', name: 'ИС-12' }, { id: 'pi-11', name: 'ПИ-11' }] }
