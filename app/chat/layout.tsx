"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { useChatSessions } from "@/hooks/use-chat-sessions"
import { Spinner } from "@/components/ui/spinner"
import { ChatSessionsProvider } from "@/contexts/chat-sessions-context"

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const chatSessions = useChatSessions()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <ChatSessionsProvider value={chatSessions}>
      <SidebarProvider>
        <ChatSidebar
          sessions={chatSessions.sessions}
          activeSessionId={chatSessions.activeSessionId}
          onSelectSession={chatSessions.setActiveSessionId}
          onNewSession={chatSessions.createSession}
          onDeleteSession={chatSessions.deleteSession}
        />
        <SidebarInset>
          <header className="flex h-14 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <h1 className="text-sm font-medium">
              {chatSessions.activeSession?.title || "Nueva conversacion"}
            </h1>
          </header>
          <main className="flex flex-1 flex-col overflow-hidden">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ChatSessionsProvider>
  )
}
