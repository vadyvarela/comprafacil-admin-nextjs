import { Fragment } from "react"
import { cn } from "@/lib/utils"

/** Markdown simples para o chat do agente (listas, negrito, títulos). */
export function AgentMessage({ text }: { text: string }) {
  const blocks = splitBlocks(text.trim())
  if (blocks.length === 0) return null

  return (
    <div className="space-y-2 text-[12px] leading-relaxed">
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  )
}

type Block =
  | { type: "heading"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "quote"; text: string }
  | { type: "p"; text: string }

function Block({ block }: { block: Block }) {
  if (block.type === "heading") {
    return <p className="font-semibold text-foreground">{inline(block.text)}</p>
  }
  if (block.type === "quote") {
    return (
      <p className="border-l-2 border-border pl-2 text-muted-foreground">{inline(block.text)}</p>
    )
  }
  if (block.type === "list") {
    const Tag = block.ordered ? "ol" : "ul"
    return (
      <Tag className={cn("space-y-0.5 pl-4", block.ordered ? "list-decimal" : "list-disc")}>
        {block.items.map((item, i) => (
          <li key={i}>{inline(item)}</li>
        ))}
      </Tag>
    )
  }
  return <p>{inline(block.text)}</p>
}

function inline(value: string) {
  const parts = value.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-background/80 px-1 py-px font-mono text-[11px]">
          {part.slice(1, -1)}
        </code>
      )
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}

function splitBlocks(text: string): Block[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n")
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i] ?? ""
    if (!line.trim()) {
      i += 1
      continue
    }

    const heading = line.match(/^#{1,3}\s+(.+)$/)
    if (heading?.[1]) {
      blocks.push({ type: "heading", text: heading[1].trim() })
      i += 1
      continue
    }

    if (line.startsWith("> ")) {
      const quote: string[] = []
      while (i < lines.length && (lines[i]?.startsWith("> ") || lines[i] === ">")) {
        quote.push((lines[i] ?? "").replace(/^>\s?/, ""))
        i += 1
      }
      blocks.push({ type: "quote", text: quote.join(" ").trim() })
      continue
    }

    const bullet = line.match(/^[-*•]\s+(.+)$/)
    const numbered = line.match(/^\d+[.)]\s+(.+)$/)
    if (bullet || numbered) {
      const ordered = Boolean(numbered)
      const items: string[] = []
      while (i < lines.length) {
        const current = lines[i] ?? ""
        const match = ordered ? current.match(/^\d+[.)]\s+(.+)$/) : current.match(/^[-*•]\s+(.+)$/)
        if (!match?.[1]) break
        items.push(match[1].trim())
        i += 1
      }
      blocks.push({ type: "list", ordered, items })
      continue
    }

    const para: string[] = [line]
    i += 1
    while (i < lines.length) {
      const next = lines[i] ?? ""
      if (!next.trim()) break
      if (/^#{1,3}\s+/.test(next) || /^[-*•]\s+/.test(next) || /^\d+[.)]\s+/.test(next) || next.startsWith("> ")) {
        break
      }
      para.push(next)
      i += 1
    }
    blocks.push({ type: "p", text: para.join(" ").trim() })
  }

  return blocks
}
