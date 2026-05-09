"use client"

import Image from "next/image"
import { MessageSquarePlus, Trash2, LogOut } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import type { ChatSession } from "@/types/chat"

interface ChatSidebarProps {
  sessions: ChatSession[]
  activeSessionId: string | null
  onSelectSession: (id: string) => void
  onNewSession: () => void
  onDeleteSession: (id: string) => void
}

export function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
}: ChatSidebarProps) {
  const { user, signOut } = useAuth()

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return "Hoy"
    if (days === 1) return "Ayer"
    if (days < 7) return `Hace ${days} dias`
    return date.toLocaleDateString("es-ES", { month: "short", day: "numeric" })
  }

  const getUserDisplayName = () => {
    if (!user) return "Usuario"
    if (user.isAnonymous) return "Invitado"
    return user.displayName || user.email?.split("@")[0] || "Usuario"
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <Image
            src="/robot-icon.jpg"
            alt={process.env.NEXT_PUBLIC_APP_NAME || "Bot003 Seteloee"}
            width={32}
            height={32}
            className="rounded-lg object-cover"
          />
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{process.env.NEXT_PUBLIC_APP_NAME || "Bot003 Seteloee"}</span>
            <span className="text-xs text-muted-foreground">Asistente IA</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <ScrollArea className="flex-1">
          <SidebarGroup>
            <SidebarGroupLabel>Conversaciones</SidebarGroupLabel>
            <SidebarGroupAction onClick={onNewSession} title="Nueva conversacion">
              <MessageSquarePlus className="size-4" />
            </SidebarGroupAction>
            <SidebarGroupContent>
              <SidebarMenu>
                {sessions.length === 0 ? (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No hay conversaciones
                  </div>
                ) : (
                  sessions.map((session) => (
                    <SidebarMenuItem key={session.id}>
                      <SidebarMenuButton
                        isActive={session.id === activeSessionId}
                        onClick={() => onSelectSession(session.id)}
                        className="pr-8"
                      >
                        <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                          <span className="truncate w-full">{session.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(session.updatedAt)}
                          </span>
                        </div>
                      </SidebarMenuButton>
                      <SidebarMenuAction
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteSession(session.id)
                        }}
                        showOnHover
                        title="Eliminar conversacion"
                      >
                        <Trash2 className="size-4" />
                      </SidebarMenuAction>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium">
              {getUserDisplayName().charAt(0).toUpperCase()}
            </div>
            <span className="truncate text-sm">{getUserDisplayName()}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            title="Cerrar sesion"
            className="shrink-0"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
