import { randomBytes, randomUUID, createHash } from 'node:crypto'
import type { Question, QuestionType, TestDefinition, NoteDefinition } from '../../../shared/types/platform'
import { database, saveDatabase, hashPassword, passwordMatches, tokenHash, publicUser, sessionUser } from '../../utils/platformStore'
import { avatarStoredLimit } from '../../../shared/utils/avatar'
import { resultOf } from '../../../shared/utils/platform'

function fail(statusCode: number, statusMessage: string): never { throw createError({ statusCode, statusMessage }) }
const text = (value: unknown, max = 20000) => typeof value === 'string' && value.length <= max ? value : fail(400, 'Invalid text')
function validateAvatar(value: unknown) {
  const encoded = text(value, Math.ceil(avatarStoredLimit / 3) * 4 + 32)
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(encoded)
  const type = match?.[1], data = match?.[2]
  if (!type || !data) fail(400, 'Invalid avatar')
  const bytes = Buffer.from(data, 'base64')
  const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  const jpeg = bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
  const webp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
  const validImage = type === 'image/png' ? png : type === 'image/jpeg' ? jpeg : webp
  if (!validImage || bytes.length > avatarStoredLimit || bytes.toString('base64') !== data) fail(400, 'Invalid avatar')
  return { type, data, version: randomUUID() }
}
function validateTest(body: Record<string, unknown>, id: string): TestDefinition {
  // Формируем допустимый тест из входных данных, не доверяя баллам и типам из формы.
  const title = text(body.title, 200).trim()
  if (!title || !Number.isFinite(body.passPercent) || Number(body.passPercent) < 0 || Number(body.passPercent) > 100) fail(400, 'Title and threshold 0..100 required')
  if (!Array.isArray(body.questions) || !body.questions.length || body.questions.length > 100) fail(400, 'Add 1..100 questions')
  const questions: Question[] = body.questions.map((q: Record<string, unknown>) => {
    if (!q || typeof q !== 'object') fail(400, 'Invalid question')
    const type = q.type as QuestionType
    if (!['text', 'choice', 'free', 'code', 'code_reference'].includes(type)) fail(400, 'Invalid answer type')
    const prompt = text(q.prompt, 5000).trim()
    const points = Number(q.points)
    if (!prompt || !Number.isInteger(points) || points < 1 || points > 100) fail(400, 'Question and points 1..100 required')
    const options = type === 'choice' && Array.isArray(q.options) ? q.options.map(o => text(o, 500).trim()).filter(Boolean) : []
    const expected = ['text', 'choice', 'code_reference'].includes(type) ? text(q.expected, type === 'code_reference' ? 30000 : 5000).trim() : ''
    if (type === 'choice' && (options.length < 2 || options.length > 20 || new Set(options).size !== options.length || !options.includes(expected))) fail(400, 'Choose a correct option; options must be unique')
    if (['text', 'code_reference'].includes(type) && !expected) fail(400, 'Expected answer required')
    return { id: typeof q.id === 'string' ? q.id.slice(0, 100) : randomUUID(), prompt, type, options, expected, points }
  })
  if (new Set(questions.map(q => q.id)).size !== questions.length) fail(400, 'Duplicate question IDs')
  return { id, title, notes: text(body.notes, 100000), noteId: typeof body.noteId === 'string' && body.noteId ? text(body.noteId,100) : null, passPercent: Number(body.passPercent), published: body.published === true, questions, updatedAt: new Date().toISOString() }
}

export default defineEventHandler(async event => {
  setHeader(event, 'Cache-Control', 'no-store')
  const method = event.method
  if (!['GET', 'HEAD'].includes(method)) {
    const origin = getHeader(event, 'origin')
    if (origin && origin !== getRequestURL(event).origin) fail(403, 'Cross-origin request rejected')
    if (Number(getHeader(event, 'content-length') || 0) > 1000000) fail(413, 'Request too large')
  }
  const path = getRouterParam(event, 'path') || ''
  const expectsBody = ['POST', 'PUT', 'PATCH'].includes(method) && !(path === 'logout' && method === 'POST')
  const body = expectsBody ? await readBody<Record<string, unknown>>(event) : {}
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail(400, 'Object body required')
  // После чтения тела операции с файлом синхронны: другой запрос не вклинится между чтением и записью.
  const db = database()
  const token = getCookie(event, 'practice_session')
  // Права берутся из текущей записи пользователя, а не из выбранной в браузере роли.
  const session = token ? db.sessions.find(s => s.token === tokenHash(token) && s.expires > Date.now()) : undefined
  const user = session ? db.users.find(u => u.id === session.userId) : undefined
  if (path === 'me' && method === 'GET') return { user: user ? sessionUser(user) : null }
  if (path === 'groups' && method === 'GET') return db.groups
  if (['login', 'register'].includes(path) && method === 'POST') {
    // Публичная регистрация всегда студенческая; привилегированные аккаунты создаёт администратор.
    if (path === 'register' && body.role !== 'student') fail(403, 'Only students can register')
    const login = text(body.login, 80).trim()
    const password = text(body.password, 200)
    if (!login || password.length < 3) fail(400, 'Login and password (3+ characters) required')
    let account = db.users.find(u => u.login.toLocaleLowerCase() === login.toLocaleLowerCase())
    if (path === 'register') {
      if (account) fail(409, 'Login already exists')
      const groupId = typeof body.groupId === 'string' && body.groupId ? body.groupId : null
      if (groupId && !db.groups.some(g => g.id === groupId)) fail(400, 'Unknown group')
      account = { id: randomUUID(), login, role: 'student', groupId, password: hashPassword(password) }
      db.users.push(account)
    } else if (!account || !passwordMatches(password, account.password)) fail(401, 'Incorrect login or password')
    if (body.role !== account!.role) fail(403, 'Selected role does not match account')
    const rawToken = randomBytes(32).toString('hex')
    db.sessions = db.sessions.filter(s => s.expires > Date.now() && s.token !== (token ? tokenHash(token) : ''))
    db.sessions.push({ token: tokenHash(rawToken), userId: account!.id, expires: Date.now() + 7 * 86400000 })
    saveDatabase(db)
    setCookie(event, 'practice_session', rawToken, { httpOnly: true, sameSite: 'lax', secure: getRequestURL(event).protocol === 'https:', path: '/', maxAge: 7 * 86400 })
    return { user: sessionUser(account!) }
  }
  if (!user) fail(401, 'Authentication required')
  if (path === 'me/avatar' && method === 'GET') {
    if (!user.avatar || getQuery(event).v !== user.avatar.version) fail(404, 'Avatar not found')
    setHeader(event, 'Content-Type', user.avatar.type)
    setHeader(event, 'X-Content-Type-Options', 'nosniff')
    return Buffer.from(user.avatar.data, 'base64')
  }
  if (path === 'me/avatar' && method === 'PATCH') {
    if (body.avatar === null) delete user.avatar
    else user.avatar = validateAvatar(body.avatar)
    saveDatabase(db)
    return { user: sessionUser(user) }
  }
  if (path === 'logout' && method === 'POST') {
    db.sessions = db.sessions.filter(s => s.token !== tokenHash(token!)); saveDatabase(db)
    deleteCookie(event, 'practice_session', { path: '/' }); return { ok: true }
  }
  const staff = user.role === 'admin' || user.role === 'teacher'
  const studentView = !staff || getQuery(event).audience === 'student'
  // Студент и предпросмотр получают одинаковый формат: без эталонов, с актуальным конспектом.
  const presentTest = (test: TestDefinition) => {
    const note = test.noteId ? db.notes.find(n => n.id === test.noteId) : undefined
    return { ...test, notes: test.noteId ? (note && (!studentView || note.published) ? note.body : '') : test.notes,
      version: test.noteId ? createHash('sha256').update(JSON.stringify([test.updatedAt, note?.updatedAt, note?.published])).digest('hex') : test.updatedAt,
      questions: test.questions.map(q => studentView ? { ...q, expected: '' } : q) }
  }
  const checkNote = (test: TestDefinition) => {
    if (test.noteId && !db.notes.some(n => n.id === test.noteId)) fail(400, 'Linked note not found')
    if (test.published && test.noteId && !db.notes.some(n => n.id === test.noteId && n.published)) fail(400, 'Publish the linked note first')
  }
  if (path === 'notes' && method === 'GET') return db.notes.filter(n => !studentView || n.published)
  const noteMatch = path.match(/^notes\/([^/]+)$/)
  if (path === 'notes' && method === 'POST' || noteMatch && method === 'PUT') {
    if (!staff) fail(403, 'Staff only')
    const title = text(body.title, 200).trim(), content = text(body.body, 100000)
    if (!title || !content.trim()) fail(400, 'Note title and content required')
    const index = noteMatch ? db.notes.findIndex(n => n.id === noteMatch[1]) : -1
    if (noteMatch && index < 0) fail(404, 'Note not found')
    const note: NoteDefinition = { id: noteMatch ? noteMatch[1]! : randomUUID(), title, body: content, published: body.published === true, updatedAt: new Date().toISOString() }
    if (noteMatch) db.notes[index] = note; else db.notes.push(note)
    saveDatabase(db); return note
  }
  if (path === 'users' && method === 'POST') {
    if (user.role !== 'admin') fail(403, 'Admin only')
    const login = text(body.login, 80).trim(), password = text(body.password, 200)
    if (!login || password.length < 3 || !['student', 'teacher', 'admin'].includes(String(body.role))) fail(400, 'Login, password and role required')
    if (db.users.some(u => u.login.toLocaleLowerCase() === login.toLocaleLowerCase())) fail(409, 'Login already exists')
    const groupId = typeof body.groupId === 'string' && body.groupId ? body.groupId : null
    if (groupId && !db.groups.some(g => g.id === groupId)) fail(400, 'Unknown group')
    const account = { id: randomUUID(), login, password: hashPassword(password), role: body.role as 'student' | 'teacher' | 'admin', groupId: body.role === 'student' ? groupId : null }
    db.users.push(account); saveDatabase(db); return publicUser(account)
  }
  if (path === 'me/group' && method === 'PATCH') {
    if (user.role !== 'student') fail(403, 'Students only')
    const groupId = body.groupId === null || body.groupId === '' ? null : text(body.groupId, 100)
    if (groupId && !db.groups.some(g => g.id === groupId)) fail(400, 'Unknown group')
    user.groupId = groupId; saveDatabase(db); return { user: sessionUser(user) }
  }
  const studentGroup = path.match(/^students\/([^/]+)\/group$/)
  if (studentGroup && method === 'PATCH') {
    if (!staff) fail(403, 'Staff only')
    const student = db.users.find(u => u.id === studentGroup[1] && u.role === 'student')
    if (!student) fail(404, 'Student not found')
    const groupId = body.groupId === null || body.groupId === '' ? null : text(body.groupId, 100)
    if (groupId && !db.groups.some(g => g.id === groupId)) fail(400, 'Unknown group')
    student.groupId = groupId; saveDatabase(db); return publicUser(student)
  }
  if (path === 'users' && method === 'GET') {
    if (user.role !== 'admin') fail(403, 'Admin only')
    return db.users.map(publicUser)
  }
  const roleMatch = path.match(/^users\/([^/]+)\/role$/)
  if (roleMatch && method === 'PATCH') {
    if (user.role !== 'admin') fail(403, 'Admin only')
    const target = db.users.find(u => u.id === roleMatch[1]); if (!target) fail(404, 'User not found')
    if (target.role === 'admin' || !['student', 'teacher'].includes(String(body.role))) fail(400, 'Only student and teacher roles can be assigned')
    target.role = body.role as 'student' | 'teacher'; saveDatabase(db); return publicUser(target)
  }
  if (path === 'analytics' && method === 'GET') {
    // Общая аналитика отделена от доступных преподавателю результатов отдельных тестов.
    if (user.role !== 'admin') fail(403, 'Admin only')
    const summarize = (attempts: typeof db.submissions) => {
      const finished = attempts.filter(s => !resultOf(s).pending)
      const passed = attempts.filter(s => resultOf(s).passed)
      return { attempts: attempts.length, pending: attempts.length - finished.length, passed: passed.length, passedStudents: new Set(passed.map(s => s.studentId)).size, average: finished.length ? Math.round(finished.reduce((n, s) => n + resultOf(s).percent, 0) / finished.length * 100) / 100 : 0 }
    }
    return { ...summarize(db.submissions), students: db.users.filter(u => u.role === 'student').length, teachers: db.users.filter(u => u.role === 'teacher').length, tests: db.tests.length,
      byTest: db.tests.map(t => ({ id: t.id, name: t.title, ...summarize(db.submissions.filter(s => s.testId === t.id)) })),
      byGroup: [...db.groups, { id: '', name: 'Без группы' }].map(g => ({ id: g.id, name: g.name, ...summarize(db.submissions.filter(s => (db.users.find(u => u.id === s.studentId)?.groupId || '') === g.id)) })) }
  }
  if (path === 'tests' && method === 'GET') return db.tests.filter(t => !studentView || t.published).map(presentTest)
  if (path === 'tests' && method === 'POST') {
    if (!staff) fail(403, 'Staff only')
    const test = validateTest(body, randomUUID()); checkNote(test); db.tests.push(test); saveDatabase(db); return presentTest(test)
  }
  const testMatch = path.match(/^tests\/([^/]+)$/)
  if (testMatch && method === 'PUT') {
    if (!staff) fail(403, 'Staff only')
    const index = db.tests.findIndex(t => t.id === testMatch[1]); if (index < 0) fail(404, 'Test not found')
    const test = validateTest(body, testMatch[1]!); checkNote(test); db.tests[index] = test; saveDatabase(db); return presentTest(test)
  }
  if (path === 'submissions' && method === 'GET') return db.submissions.filter(s => staff || s.studentId === user.id)
  if (path === 'students' && method === 'GET') {
    if (!staff) fail(403, 'Staff only')
    return db.users.filter(u => u.role === 'student').map(publicUser)
  }
  if (path === 'submissions' && method === 'POST') {
    if (user.role !== 'student') fail(403, 'Students only')
    const test = db.tests.find(t => t.id === body.testId && t.published); if (!test) fail(404, 'Test not found')
    if (body.version !== presentTest(test).version) fail(409, 'Test changed; reopen it before submitting')
    const input = body.answers as Record<string, unknown>
    if (!input || typeof input !== 'object') fail(400, 'Answers required')
    // Баллы считаем на сервере; копия вопроса сохраняет условия попытки после будущих правок теста.
    const answers = test.questions.map(q => {
      const value = text(input[q.id], 30000)
      if (!value.trim()) fail(400, 'Answer every question')
      if (q.type === 'choice' && !q.options.includes(value)) fail(400, 'Invalid choice')
      const automatic = ['text', 'choice', 'code_reference'].includes(q.type)
      const normalize = (s: string) => q.type === 'code_reference' ? s.replace(/\r\n?/g, '\n').trim() : s.trim()
      return { question: structuredClone(q), value, points: automatic ? (normalize(value) === normalize(q.expected) ? q.points : 0) : null, comment: '' }
    })
    const submission = { id: randomUUID(), testId: test.id, testTitle: test.title, studentId: user.id, studentLogin: user.login, submittedAt: new Date().toISOString(), passPercent: test.passPercent, answers }
    db.submissions.push(submission); saveDatabase(db); return submission
  }
  const review = path.match(/^submissions\/([^/]+)$/)
  if (review && method === 'PATCH') {
    // Вручную оцениваются только произвольный текст и обычный код, в пределах баллов вопроса.
    if (!staff) fail(403, 'Staff only')
    const submission = db.submissions.find(s => s.id === review[1]); if (!submission) fail(404, 'Submission not found')
    if (!Array.isArray(body.grades)) fail(400, 'Grades required')
    for (const grade of body.grades) {
      const answer = submission.answers.find(a => a.question.id === grade.questionId)
      if (!answer || !['free', 'code'].includes(answer.question.type)) fail(400, 'Only manual answers can be graded')
      if (!Number.isFinite(grade.points) || grade.points < 0 || grade.points > answer.question.points) fail(400, 'Grade outside allowed range')
      answer.points = grade.points; answer.comment = text(grade.comment, 5000)
    }
    saveDatabase(db); return submission
  }
  fail(404, 'Route not found')
})
