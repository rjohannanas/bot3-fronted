"use client"

import { useState, useCallback, useEffect } from "react"
import { useChatSessionsContext } from "@/contexts/chat-sessions-context"
import { useChatStream } from "@/hooks/use-chat-stream"
import { MessageList } from "@/components/chat/message-list"
import { ChatInput } from "@/components/chat/chat-input"
import { StatusIndicator } from "@/components/chat/status-indicator"
import type { AgentStatus, Source } from "@/types/chat"

export default function ChatPage() {
  const {
    activeSession,
    activeSessionId,
    createSession,
    addMessage,
    updateLastAssistantMessage,
    isLoaded,
  } = useChatSessionsContext()

  const { sendMessage, cancelStream, isStreaming } = useChatStream()
  const [streamingContent, setStreamingContent] = useState("")
  const [status, setStatus] = useState<AgentStatus>("idle")
  const [pendingSources, setPendingSources] = useState<Source[]>([])

  // Reset streaming state when session changes
  useEffect(() => {
    setStreamingContent("")
    setStatus("idle")
    setPendingSources([])
  }, [activeSessionId])

  const handleSend = useCallback(
    async (content: string) => {
      let sessionId = activeSessionId

      // Create a new session if none exists
      if (!sessionId) {
        sessionId = createSession()
      }

      // Add user message
      addMessage(sessionId, {
        role: "user",
        content,
      })

      // Add placeholder for assistant message
      addMessage(sessionId, {
        role: "assistant",
        content: "",
      })

      setStreamingContent("")
      setPendingSources([])

      let accumulatedContent = ""
      let currentSources: any[] = []

      await sendMessage(content, {
        sessionId,
        onToken: (token) => {
          accumulatedContent += token
          setStreamingContent(accumulatedContent)
        },
        onSources: (sources) => {
          currentSources = sources
          setPendingSources(sources)
        },
        onStatus: (newStatus) => {
          setStatus(newStatus)
        },
        onComplete: () => {
          // Update the placeholder message with final content and sources
          updateLastAssistantMessage(sessionId!, accumulatedContent, currentSources.length > 0 ? currentSources : undefined)
          setStreamingContent("")
          setPendingSources([])
        },
        onError: (error) => {
          updateLastAssistantMessage(sessionId!, `Error: ${error}`)
          setStreamingContent("")
          setPendingSources([])
        },
      })
    },
    [activeSessionId, createSession, addMessage, sendMessage, updateLastAssistantMessage]
  )

  if (!isLoaded) {
    return null
  }

  const messages = activeSession?.messages || []

  return (
    <div className="flex h-full flex-col">
      <MessageList
        messages={messages}
        streamingContent={streamingContent}
        isStreaming={isStreaming}
      />

      {status !== "idle" && (
        <div className="mx-auto max-w-3xl px-4 pb-2">
          <StatusIndicator status={status} />
        </div>
      )}

      <ChatInput
        onSend={handleSend}
        onCancel={cancelStream}
        disabled={isStreaming}
        isStreaming={isStreaming}
      />
    </div>
  )
}
