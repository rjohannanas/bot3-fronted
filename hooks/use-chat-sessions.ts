"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useApi } from "@/hooks/use-api"
import type { ChatSession, Message } from "@/types/chat"

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

  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionIdState] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // ── 1. Cargar sesiones desde la nube al iniciar (cuando el token esté disponible) ──
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
          messages: [],          // Los mensajes se cargan bajo demanda al seleccionar
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        }))
        setSessions(mapped)
        if (mapped.length > 0) {
          setActiveSessionIdState(mapped[0].id)
        }
      } catch (err) {
        console.error("[useChatSessions] Error cargando sesiones:", err)
      } finally {
        setIsLoaded(true)
      }
    }

    loadSessions()
  }, [token]) // Se ejecuta cada vez que el token cambia (login/logout)

  // ── Sesión activa ──────────────────────────────────────────────────
  const activeSession = sessions.find((s) => s.id === activeSessionId) || null

  // ── 2. Seleccionar sesión: cargar mensajes desde la nube si aún no están ──
  const setActiveSessionId = useCallback(
    async (id: string) => {
      setActiveSessionIdState(id)

      const session = sessions.find((s) => s.id === id)
      if (!session || session.messages.length > 0) return  // Ya tiene mensajes cargados

      try {
        const res = await apiFetch(`/api/chat/sessions/${id}`)
        if (!res.ok) throw new Error("Error cargando mensajes")

        const data: MessageAPI[] = await res.json()
        const messages: Message[] = data.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        }))

        setSessions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, messages } : s))
        )
      } catch (err) {
        console.error("[useChatSessions] Error cargando mensajes:", err)
      }
    },
    [sessions, apiFetch]
  )

  // ── 3. Crear sesión nueva (el ID lo genera el backend implícitamente en el primer mensaje) ──
  const createSession = useCallback((): string => {
    // Generamos un ID temporal local; el backend lo recibirá en el primer POST /api/chat/stream
    const tempId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    const newSession: ChatSession = {
      id: tempId,
      title: "Nueva conversación",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setSessions((prev) => [newSession, ...prev])
    setActiveSessionIdState(tempId)
    return tempId
  }, [])

  // ── 4. Eliminar sesión: borrar en la nube y luego del estado local ──
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
          setActiveSessionIdState(filtered.length > 0 ? filtered[0].id : null)
        }
        return filtered
      })
    },
    [activeSessionId, apiFetch]
  )

  // ── 5. Agregar mensaje al estado local (el backend ya lo guarda en el stream) ──
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

  // ── 6. Actualizar último mensaje del asistente con el texto final del stream ──
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
