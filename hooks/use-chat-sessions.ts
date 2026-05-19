"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useApi } from "@/hooks/use-api"
import type { ChatSession, Message } from "@/types/chat"
import { useParams, useRouter } from "next/navigation"

// ─── Tipos de respuesta de la API ──────────────────────────────────
interface SessionSummaryAPI {
  id: string
  title: string
  created_at: number  // ms
  updated_at: number  // ms
}

interface MessageAPI {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number   // ms
}

// ─── Helper local ──────────────────────────────────────────────────
function generateLocalTitle(firstMessage: string): string {
  const truncated = firstMessage.slice(0, 40)
  return truncated.length < firstMessage.length ? `${truncated}...` : truncated
}

// ─── Hook principal ────────────────────────────────────────────────
export function useChatSessions() {
  const { token } = useAuth()
  const { apiFetch } = useApi()
  const router = useRouter()
  const params = useParams()
  
  // En Next.js [[...id]], params.id es un array. Tomamos el primer elemento si existe.
  const urlId = params?.id?.[0] || null

  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionIdState] = useState<string | null>(urlId)
  const [isLoaded, setIsLoaded] = useState(false)

  // ── 1. Cargar sesiones desde la nube al iniciar ──
  useEffect(() => {
    if (!token) return

    const loadSessions = async () => {
      try {
        const res = await apiFetch("/api/chat/sessions")
        if (!res.ok) throw new Error("Error cargando sesiones")

        const data: SessionSummaryAPI[] = await res.json()
        const mapped: ChatSession[] = data.map((s) => ({
          id: s.id,
          title: s.title,
          messages: [],          
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        }))
        
        setSessions(mapped)

        if (urlId) {
          // Si entramos con un ID por URL que no existe en la BD, creamos una sesión temporal local
          if (!mapped.some(s => s.id === urlId)) {
            const newSession: ChatSession = {
              id: urlId,
              title: "Nueva conversación",
              messages: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            }
            setSessions(prev => [newSession, ...prev])
          }
          setActiveSessionIdState(urlId)
        } else if (mapped.length > 0) {
          // Si entramos a /chat sin ID, redirigimos al más reciente
          router.replace(`/chat/${mapped[0].id}`)
        } else {
          // No hay chats, creamos uno nuevo con un UUID
          const tempId = crypto.randomUUID()
          router.replace(`/chat/${tempId}`)
        }
      } catch (err) {
        console.error("[useChatSessions] Error cargando sesiones:", err)
      } finally {
        setIsLoaded(true)
      }
    }

    loadSessions()
  }, [token]) // Solo cargar al montar (o al iniciar sesión)

  // ── 2. Sincronizar URL con estado local (Navegación por la UI) ──
  useEffect(() => {
    if (urlId && urlId !== activeSessionId) {
      setActiveSessionIdState(urlId)
    }
  }, [urlId, activeSessionId])

  // ── 3. Cargar mensajes del chat activo si están vacíos ──
  useEffect(() => {
    if (!activeSessionId) return
    const session = sessions.find((s) => s.id === activeSessionId)
    if (!session || session.messages.length > 0) return // Ya cargados o no existe

    const fetchMessages = async () => {
      try {
        const res = await apiFetch(`/api/chat/sessions/${activeSessionId}`)
        if (!res.ok) return
        
        const data: MessageAPI[] = await res.json()
        const messages: Message[] = data.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        }))
        
        setSessions((prev) =>
          prev.map((s) => (s.id === activeSessionId ? { ...s, messages } : s))
        )
      } catch (err) {
        console.error("[useChatSessions] Error cargando mensajes:", err)
      }
    }
    
    fetchMessages()
  }, [activeSessionId, sessions, apiFetch])

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null

  // ── 4. Seleccionar sesión desde el Sidebar (Cambia la URL) ──
  const setActiveSessionId = useCallback(
    async (id: string) => {
      router.push(`/chat/${id}`)
    },
    [router]
  )

  // ── 5. Crear sesión nueva (Cambia la URL a un nuevo UUID) ──
  const createSession = useCallback((): string => {
    const tempId = crypto.randomUUID()
    router.push(`/chat/${tempId}`)
    return tempId
  }, [router])

  // ── 6. Eliminar sesión ──
  const deleteSession = useCallback(
    async (sessionId: string) => {
      try {
        await apiFetch(`/api/chat/sessions/${sessionId}`, { method: "DELETE" })
      } catch (err) {
        console.error("[useChatSessions] Error eliminando sesión:", err)
      }

      setSessions((prev) => {
        const filtered = prev.filter((s) => s.id !== sessionId)
        if (activeSessionId === sessionId) {
          // Si borramos el chat actual, redirigimos a otro o creamos uno nuevo
          const nextId = filtered.length > 0 ? filtered[0].id : crypto.randomUUID()
          router.push(`/chat/${nextId}`)
        }
        return filtered
      })
    },
    [activeSessionId, apiFetch, router]
  )

  // ── 7. Agregar mensaje al estado local (el backend lo guarda vía streaming) ──
  const addMessage = useCallback(
    (sessionId: string, message: Omit<Message, "id" | "timestamp">) => {
      const newMessage: Message = {
        ...message,
        id: `local-${Date.now()}`,
        timestamp: Date.now(),
      }

      setSessions((prev) =>
        prev.map((session) => {
          if (session.id !== sessionId) return session

          const updatedMessages = [...session.messages, newMessage]
          const shouldUpdateTitle =
            session.title === "Nueva conversación" &&
            message.role === "user" &&
            session.messages.length === 0

          return {
            ...session,
            messages: updatedMessages,
            title: shouldUpdateTitle
              ? generateLocalTitle(message.content)
              : session.title,
            updatedAt: Date.now(),
          }
        })
      )

      return newMessage
    },
    []
  )

  // ── 8. Actualizar último mensaje del asistente con la respuesta final del stream ──
  const updateLastAssistantMessage = useCallback(
    (sessionId: string, content: string, sources?: Message["sources"]) => {
      setSessions((prev) =>
        prev.map((session) => {
          if (session.id !== sessionId) return session

          const messages = [...session.messages]
          const lastIndex = messages.length - 1

          if (lastIndex >= 0 && messages[lastIndex].role === "assistant") {
            messages[lastIndex] = {
              ...messages[lastIndex],
              content,
              sources: sources || messages[lastIndex].sources,
            }
          }

          return { ...session, messages, updatedAt: Date.now() }
        })
      )
    },
    []
  )

  return {
    sessions,
    activeSession,
    activeSessionId,
    isLoaded,
    setActiveSessionId,
    createSession,
    deleteSession,
    addMessage,
    updateLastAssistantMessage,
  }
}
