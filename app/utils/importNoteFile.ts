export const noteBodyLimit = 100_000
export const noteFileAccept = '.md,.markdown,.txt,.docx,text/markdown,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export async function importNoteFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase()
  const word = extension === 'docx'
  if (!word && !['md', 'markdown', 'txt'].includes(extension ?? '')) {
    throw new Error('Выберите файл Markdown, DOCX или TXT.')
  }
  const limit = word ? 5 * 1024 * 1024 : 150_000
  if (file.size > limit) throw new Error(word ? 'Размер DOCX должен быть до 5 МБ.' : 'Размер текстового файла должен быть до 150 КБ.')

  let content: string
  let omittedImages = false
  try {
    if (word) {
      const { convertWordNote } = await import('./wordNote')
      const result = await convertWordNote(await file.arrayBuffer())
      content = result.content
      omittedImages = result.omittedImages
    } else {
      content = (await file.text()).replace(/^\uFEFF/, '')
    }
  } catch {
    throw new Error('Не удалось прочитать файл. Проверьте, открывается ли он в исходном приложении.')
  }
  if (!content.trim()) throw new Error('В файле нет текста для конспекта.')
  if (content.length > noteBodyLimit) throw new Error('Конспект должен быть не длиннее 100 000 символов.')
  return { content, omittedImages }
}
