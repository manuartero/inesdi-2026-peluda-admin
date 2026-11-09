// The contracts use a small Markdown subset: `#`/`##`/`###` headings, `- ` lists and plain paragraphs.
// Anything else shows as a paragraph, as written.

type Block = { kind: 'h1' | 'h2' | 'h3' | 'list' | 'paragraph'; lines: string[] }

const HEADINGS = [
  { prefix: '### ', kind: 'h3' },
  { prefix: '## ', kind: 'h2' },
  { prefix: '# ', kind: 'h1' },
] as const

function toBlock(chunk: string): Block {
  const lines = chunk.split('\n').map((line) => line.trim())
  const heading = HEADINGS.find(({ prefix }) => lines[0].startsWith(prefix))
  if (heading) {
    return { kind: heading.kind, lines: [lines[0].slice(heading.prefix.length)] }
  }
  if (lines.every((line) => line.startsWith('- '))) {
    return { kind: 'list', lines: lines.map((line) => line.slice(2)) }
  }
  return { kind: 'paragraph', lines: [lines.join(' ')] }
}

function toBlocks(markdown: string) {
  return markdown
    .split(/\n\s*\n/)
    .filter((chunk) => chunk.trim() !== '')
    .map(toBlock)
}

function ContractBlock({ block }: { block: Block }) {
  const [first] = block.lines
  return (
    <>
      {block.kind === 'h1' && <h2 className="text-lg font-semibold tracking-tight">{first}</h2>}
      {block.kind === 'h2' && <h3 className="pt-4 text-base font-semibold">{first}</h3>}
      {block.kind === 'h3' && <h4 className="pt-2 font-semibold">{first}</h4>}
      {block.kind === 'paragraph' && <p>{first}</p>}
      {block.kind === 'list' && (
        <ul className="list-disc space-y-1 pl-5">
          {block.lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
    </>
  )
}

export function ContractText({ markdown }: { markdown: string }) {
  const blocks = toBlocks(markdown)
  return (
    <article className="space-y-3 text-sm leading-relaxed">
      {blocks.map((block, index) => (
        <ContractBlock key={index} block={block} />
      ))}
    </article>
  )
}
