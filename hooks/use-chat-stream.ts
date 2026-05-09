"use client"

import { useState, useCallback, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import type { AgentStatus, Source } from "@/types/chat"

const API_URL = process.env.NEXT_PUBLIC_API_URL

interface UseChatStreamOptions {
  sessionId: string
  onToken: (token: string) => void
  onSources: (sources: Source[]) => void
  onStatus: (status: AgentStatus) => void
  onComplete: () => void
  onError: (error: string) => void
}

export function useChatStream() {
  const { token, refreshToken } = useAuth()
  const [isStreaming, setIsStreaming] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(
    async (message: string, options: UseChatStreamOptions) => {
      if (!token) {
        options.onError("No estas autenticado")
        return
      }

      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()
      setIsStreaming(true)
      options.onStatus("thinking")

      let currentToken = token

      const attemptStream = async (authToken: string): Promise<boolean> => {
        try {
          const response = await fetch(`${API_URL}/api/chat/stream`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              message,
              session_id: options.sessionId,
            }),
            signal: abortControllerRef.current?.signal,
          })

          if (response.status === 401) {
            // Token expired, try to refresh
            const newToken = await refreshToken()
            if (newToken) {
              return false // Signal to retry with new token
            }
            throw new Error("Sesion expirada. Por favor, inicia sesion de nuevo.")
          }

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.detail || `Error del servidor: ${response.status}`)
          }

          if (!response.body) {
            throw new Error("No se recibio respuesta del servidor")
          }

          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ""

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split("\n")
            buffer = lines.pop() || ""

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue

              const data = line.slice(6).trim()
              if (!data || data === "[DONE]") continue

              try {
                const event = JSON.parse(data)

                switch (event.type) {
                  case "status":
                    // event.message contiene el estado (ej: "Analizando consulta...")
                    options.onStatus(mapStatus(event.message))
                    break
                  case "sources":
                    // event.docs contiene el array de documentos
                    options.onSources(event.docs || [])
                    break
                  case "token":
                    // event.content contiene la letra/token
                    options.onToken(event.content)
                    break
                  case "error":
                    options.onError(event.message || "Error desconocido")
                    break
                  case "done":
                    // El onComplete se maneja tras completar el stream exitosamente
                    break
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }

          return true // Success
        } catch (error) {
          if ((error as Error).name === "AbortError") {
            return true // User cancelled, don't retry
          }
          throw error
        }
      }

      try {
        let success = false
        let retries = 0
        const MAX_RETRIES = 1

        while (retries <= MAX_RETRIES) {
          try {
            success = await attemptStream(currentToken)
            
            // Si retorno false, es porque el token caduco
            if (!success) {
              const newToken = await refreshToken()
              if (newToken) {
                currentToken = newToken
                success = await attemptStream(currentToken)
              }
            }
            break; // Salio de attemptStream sin lanzar excepcion = Exito o Token renovado
          } catch (error) {
            if (retries >= MAX_RETRIES) {
              throw error; // Nos quedamos sin reintentos
            }
            retries++;
            // Mostrarle al usuario que estamos reintentando silenciosamente
            options.onStatus("thinking");
            await new Promise(resolve => setTimeout(resolve, 1500)); // Esperar 1.5s antes de reintentar
          }
        }

        if (success) {
          options.onComplete()
        }
      } catch (error) {
        // Formatear mensajes amigables para errores de red
        const errorMessage = error instanceof Error ? error.message : "Error de conexion";
        const finalMessage = errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")
          ? "La conexion fallo, pero el sistema se esta recuperando. Por favor, vuelve a enviar tu mensaje."
          : errorMessage;
        
        options.onError(finalMessage)
      } finally {
        setIsStreaming(false)
        options.onStatus("idle")
        abortControllerRef.current = null
      }
    },
    [token, refreshToken]
  )

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsStreaming(false)
    }
  }, [])

  return {
    sendMessage,
    cancelStream,
    isStreaming,
  }
}

function mapStatus(statusMessage: string): AgentStatus {
  const message = statusMessage.toLowerCase()
  if (message.includes("buscando") || message.includes("searching") || message.includes("recuperando")) {
    return "searching"
  }
  if (message.includes("analizando") || message.includes("analyzing") || message.includes("procesando")) {
    return "analyzing"
  }
  if (message.includes("generando") || message.includes("generating") || message.includes("respondiendo")) {
    return "generating"
  }
  return "thinking"
}
