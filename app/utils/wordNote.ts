import mammoth from 'mammoth'
import TurndownService from 'turndown'
import { tables } from 'turndown-plugin-gfm'

export async function convertWordNote(arrayBuffer: ArrayBuffer) {
  const { value } = await mammoth.convertToHtml({ arrayBuffer }, {
    externalFileAccess: false,
    includeEmbeddedStyleMap: false,
    convertImage: mammoth.images.imgElement(async () => ({ src: '' })),
    styleMap: ["p[style-name='Code Block'] => pre > code:separator('\\n')"],
  })
  const template = document.createElement('template')
  template.innerHTML = value
  const images = template.content.querySelectorAll('img')
  for (const image of images) image.remove()
  for (const table of template.content.querySelectorAll('table')) {
    const firstRow = table.rows[0]
    if (!firstRow || firstRow.parentElement?.tagName === 'THEAD') continue
    // Markdown tables require a header. Use the first Word row when one is absent.
    for (const cell of Array.from(firstRow.cells)) {
      if (cell.tagName === 'TH') continue
      const heading = document.createElement('th')
      heading.append(...cell.childNodes)
      cell.replaceWith(heading)
    }
  }

  const markdown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' })
  markdown.use(tables)
  markdown.addRule('wordTableCell', {
    filter: ['th', 'td'],
    replacement(content, cell) {
      const inline = content.trim().replace(/\s*\n\s*/g, ' ').replace(/\|/g, '\\|')
      return (cell.previousElementSibling ? ' ' : '| ') + inline + ' |'
    },
  })
  markdown.addRule('strike', { filter: ['del', 's'], replacement: content => '~~' + content + '~~' })
  return { content: markdown.turndown(template.innerHTML), omittedImages: images.length > 0 }
}
