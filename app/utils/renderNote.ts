import MarkdownIt from 'markdown-it'

const markdown = new MarkdownIt({ html: false, breaks: true })
markdown.renderer.rules.table_open = () => '<div class="note-table-scroll"><table>'
markdown.renderer.rules.table_close = () => '</table></div>'

export function renderNote(text: string) {
  return markdown.render(text)
}
