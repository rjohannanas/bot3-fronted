"use client"

import { createContext, useContext, type ReactNode } from "react"
import type { useChatSessions } from "@/hooks/use-chat-sessions"

type ChatSessionsContextType = ReturnType<typeof useChatSessions>

const ChatSessionsContext = createContext<ChatSessionsContextType | undefined>(undefined)

export function ChatSessionsProvider({
  children,
  value,
}: {
  children: ReactNode
  value: ChatSessionsContextType
}) {
  return (
    <ChatSessionsContext.Provider value={value}>
      {children}
    </ChatSessionsContext.Provider>
  )
}

export function useChatSessionsContext() {
  const context = useContext(ChatSessionsContext)
  if (context === undefined) {
    throw new Error("useChatSessionsContext must be used within a ChatSessionsProvider")
  }
  return context
}
