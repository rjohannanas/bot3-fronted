"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSend: (message: string) => void
  onCancel?: () => void
  disabled?: boolean
  isStreaming?: boolean
}

export function ChatInput({ onSend, onCancel, disabled, isStreaming }: ChatInputProps) {
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [value])

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="border-t bg-background p-4">
      <div className="mx-auto max-w-3xl">
        <div className="relative flex items-end gap-2 rounded-lg border bg-background p-2 shadow-sm">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu pregunta..."
            disabled={disabled}
            rows={1}
            className={cn(
              "flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
              "max-h-[200px] min-h-[36px]"
            )}
          />

          {isStreaming ? (
            <Button
              size="icon"
              variant="destructive"
              onClick={onCancel}
              className="shrink-0"
            >
              <Square className="size-4" />
              <span className="sr-only">Detener</span>
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={handleSubmit}
              disabled={!value.trim() || disabled}
              className="shrink-0"
            >
              <Send className="size-4" />
              <span className="sr-only">Enviar</span>
            </Button>
          )}
        </div>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          {process.env.NEXT_PUBLIC_APP_NAME || "El asistente"} puede cometer errores. Verifica la informacion importante.
        </p>
      </div>
    </div>
  )
}
