"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { User } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SourceCards } from "./source-cards"
import type { Message } from "@/types/chat"
import { cn } from "@/lib/utils"

interface MessageListProps {
  messages: Message[]
  streamingContent?: string
  isStreaming?: boolean
}

export function MessageList({ messages, streamingContent, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingContent])

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <Image
          src="/robot-icon.jpg"
          alt={process.env.NEXT_PUBLIC_APP_NAME || "Bot003 Seteloee"}
          width={64}
          height={64}
          className="size-16 rounded-2xl object-cover shrink-0"
        />
        <div>
          <h2 className="text-lg font-semibold">Bienvenido a {process.env.NEXT_PUBLIC_APP_NAME || "Bot003 Seteloee"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Hazme una pregunta sobre los documentos disponibles
          </p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="flex flex-col gap-6">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isStreaming && streamingContent && (
            <div className="flex items-start gap-3">
              <Image
                src="/robot-icon.jpg"
                alt={process.env.NEXT_PUBLIC_APP_NAME || "Bot003"}
                width={32}
                height={32}
                className="size-8 rounded-lg shrink-0 object-cover"
              />
              <div className="flex-1 space-y-2">
                <div className="prose prose-sm dark:prose-invert max-w-none rounded-lg bg-muted p-3">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {streamingContent}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>
    </ScrollArea>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
      {isUser ? (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <User className="size-4" />
        </div>
      ) : (
        <Image
          src="/robot-icon.jpg"
          alt={process.env.NEXT_PUBLIC_APP_NAME || "Bot003"}
          width={32}
          height={32}
          className="size-8 rounded-lg shrink-0 object-cover"
        />
      )}

      <div className={cn("flex-1 space-y-2", isUser && "flex flex-col items-end")}>
        <div
          className={cn(
            "prose prose-sm dark:prose-invert max-w-none rounded-lg p-3",
            isUser
              ? "bg-primary text-primary-foreground prose-p:text-primary-foreground prose-strong:text-primary-foreground prose-code:text-primary-foreground"
              : "bg-muted"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap m-0">{message.content}</p>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {message.sources && message.sources.length > 0 && (
          <SourceCards sources={message.sources} />
        )}
      </div>
    </div>
  )
}
