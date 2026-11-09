import { cn } from '@/lib/utils'

// Renders the small Markdown subset our hand-written documents use (contracts, brand voice guide):
// `#`/`##`/`###` headings, `- ` and `1. ` lists, `> ` quotes, `| a | b |` tables, `**bold**` and plain paragraphs.
// Anything else shows as a paragraph, as written.

type Block =
  | { kind: 'h1' | 'h2' | 'h3' | 'paragraph' | 'quote'; text: string }
  | { kind: 'list' | 'numbered'; items: string[] }
  | { kind: 'table'; header: string[]; rows: string[][] }

const HEADINGS = [
  { prefix: '### ', kind: 'h3' },
  { prefix: '## ', kind: 'h2' },
  { prefix: '# ', kind: 'h1' },
] as const

const NUMBERED_ITEM = /^\d+\.\s/
const TABLE_DIVIDER = /^\|[\s|:-]+\|$/

// tableCells('| Sí | No |') is ['Sí', 'No'].
const tableCells = (line: string) =>
  line
    .slice(1, -1)
    .split('|')
    .map((cell) => cell.trim())

function toTable(lines: string[]): Block {
  const [header, ...rest] = lines
  const rows = rest.filter((line) => !TABLE_DIVIDER.test(line))
  return { kind: 'table', header: tableCells(header), rows: rows.map(tableCells) }
}

function toBlock(chunk: string): Block {
  const lines = chunk.split('\n').map((line) => line.trim())
  const heading = HEADINGS.find(({ prefix }) => lines[0].startsWith(prefix))
  if (heading) {
    return { kind: heading.kind, text: lines[0].slice(heading.prefix.length) }
  }
  if (lines.every((line) => line.startsWith('|'))) {
    return toTable(lines)
  }
  if (lines.every((line) => line.startsWith('- '))) {
    return { kind: 'list', items: lines.map((line) => line.slice(2)) }
  }
  if (lines.every((line) => NUMBERED_ITEM.test(line))) {
    return { kind: 'numbered', items: lines.map((line) => line.replace(NUMBERED_ITEM, '')) }
  }
  if (lines.every((line) => line.startsWith('>'))) {
    return { kind: 'quote', text: lines.map((line) => line.replace(/^>\s?/, '')).join(' ') }
  }
  return { kind: 'paragraph', text: lines.join(' ') }
}

function toBlocks(markdown: string) {
  return markdown
    .split(/\n\s*\n/)
    .filter((chunk) => chunk.trim() !== '')
    .map(toBlock)
}

// Splitting 'a **b** c' on the bold marks gives ['a ', 'b', ' c']: odd positions are bold.
function Inline({ text }: { text: string }) {
  const parts = text.replace(/`/g, '').split('**')
  return (
    <>
      {parts.map((part, index) => {
        const isBold = index % 2 === 1
        return (
          <span key={index} className={cn(isBold && 'font-semibold')}>
            {part}
          </span>
        )
      })}
    </>
  )
}

function Table({ header, rows }: { header: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-left">
        <thead className="bg-muted/50">
          <tr>
            {header.map((cell) => (
              <th key={cell} className="px-3 py-2 font-medium">
                <Inline text={cell} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-t align-top">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-2">
                  <Inline text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MarkdownBlock({ block }: { block: Block }) {
  return (
    <>
      {block.kind === 'h1' && (
        <h2 className="text-lg font-semibold tracking-tight">
          <Inline text={block.text} />
        </h2>
      )}
      {block.kind === 'h2' && (
        <h3 className="pt-4 text-base font-semibold">
          <Inline text={block.text} />
        </h3>
      )}
      {block.kind === 'h3' && (
        <h4 className="pt-2 font-semibold">
          <Inline text={block.text} />
        </h4>
      )}
      {block.kind === 'paragraph' && (
        <p>
          <Inline text={block.text} />
        </p>
      )}
      {block.kind === 'quote' && (
        <blockquote className="border-l-2 pl-4 text-muted-foreground">
          <Inline text={block.text} />
        </blockquote>
      )}
      {block.kind === 'list' && (
        <ul className="list-disc space-y-1 pl-5">
          {block.items.map((item) => (
            <li key={item}>
              <Inline text={item} />
            </li>
          ))}
        </ul>
      )}
      {block.kind === 'numbered' && (
        <ol className="list-decimal space-y-1 pl-5">
          {block.items.map((item) => (
            <li key={item}>
              <Inline text={item} />
            </li>
          ))}
        </ol>
      )}
      {block.kind === 'table' && <Table header={block.header} rows={block.rows} />}
    </>
  )
}

export function MarkdownText({ markdown }: { markdown: string }) {
  const blocks = toBlocks(markdown)
  return (
    <article className="space-y-3 text-sm leading-relaxed">
      {blocks.map((block, index) => (
        <MarkdownBlock key={index} block={block} />
      ))}
    </article>
  )
}
