"use client"

import { useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Digite aqui...",
  className,
  disabled = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isEmpty, setIsEmpty] = useState(!value || value.trim() === "")

  useEffect(() => {
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML
      if (currentHtml !== value) {
        editorRef.current.innerHTML = value || ""
      }
      setIsEmpty(!value || value.trim() === "" || value === "<br>")
    }
  }, [value])

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML
      setIsEmpty(!html || html.trim() === "" || html === "<br>")
      onChange(html)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData("text/plain")
    document.execCommand("insertText", false, text)
  }

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    if (editorRef.current) {
      editorRef.current.focus()
    }
    handleInput()
  }

  return (
    <div className={cn("border border-input rounded-md", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/50">
        <button
          type="button"
          onClick={() => execCommand("bold")}
          className="p-2 hover:bg-accent rounded text-sm font-bold"
          title="Negrito"
          disabled={disabled}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => execCommand("italic")}
          className="p-2 hover:bg-accent rounded text-sm italic"
          title="Itálico"
          disabled={disabled}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => execCommand("underline")}
          className="p-2 hover:bg-accent rounded text-sm underline"
          title="Sublinhado"
          disabled={disabled}
        >
          <u>U</u>
        </button>
        <div className="w-px h-6 bg-border mx-1" />
        <button
          type="button"
          onClick={() => execCommand("formatBlock", "<h2>")}
          className="p-2 hover:bg-accent rounded text-xs font-semibold"
          title="Título"
          disabled={disabled}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => execCommand("formatBlock", "<h3>")}
          className="p-2 hover:bg-accent rounded text-xs font-semibold"
          title="Subtítulo"
          disabled={disabled}
        >
          H3
        </button>
        <div className="w-px h-6 bg-border mx-1" />
        <button
          type="button"
          onClick={() => execCommand("insertUnorderedList")}
          className="p-2 hover:bg-accent rounded text-sm"
          title="Lista"
          disabled={disabled}
        >
          • Lista
        </button>
        <button
          type="button"
          onClick={() => execCommand("insertOrderedList")}
          className="p-2 hover:bg-accent rounded text-sm"
          title="Lista numerada"
          disabled={disabled}
        >
          1. Lista
        </button>
        <div className="w-px h-6 bg-border mx-1" />
        <button
          type="button"
          onClick={() => execCommand("justifyLeft")}
          className="p-2 hover:bg-accent rounded text-sm"
          title="Alinhar à esquerda"
          disabled={disabled}
        >
          ⬅
        </button>
        <button
          type="button"
          onClick={() => execCommand("justifyCenter")}
          className="p-2 hover:bg-accent rounded text-sm"
          title="Centralizar"
          disabled={disabled}
        >
          ⬌
        </button>
        <button
          type="button"
          onClick={() => execCommand("justifyRight")}
          className="p-2 hover:bg-accent rounded text-sm"
          title="Alinhar à direita"
          disabled={disabled}
        >
          ➡
        </button>
      </div>

      {/* Editor */}
      <div className="relative">
        {isEmpty && (
          <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none z-0">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable={!disabled}
          onInput={handleInput}
          onPaste={handlePaste}
          onFocus={() => {
            if (editorRef.current && isEmpty) {
              editorRef.current.innerHTML = ""
              setIsEmpty(false)
            }
          }}
          className={cn(
            "min-h-[200px] p-4 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 relative z-10",
            disabled && "cursor-not-allowed opacity-50",
            "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2",
            "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-2",
            "[&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-2",
            "[&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-2",
            "[&_p]:my-2"
          )}
          style={{
            minHeight: "200px",
          }}
        />
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          pointer-events: none;
        }
      `}} />
    </div>
  )
}

