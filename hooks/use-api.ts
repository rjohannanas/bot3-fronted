"use client"

import { useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"

const API_URL = process.env.NEXT_PUBLIC_API_URL

/**
 * Hook utilitario que provee funciones de fetch autenticadas con el token de Firebase.
 * Centraliza el manejo de headers y renovación de token en caso de 401.
 */
export function useApi() {
  const { token, refreshToken } = useAuth()

  const apiFetch = useCallback(
    async (path: string, options: RequestInit = {}): Promise<Response> => {
      const doFetch = async (authToken: string) =>
        fetch(`${API_URL}${path}`, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
            ...options.headers,
          },
        })

      let response = await doFetch(token || "")

      // Si el token expiró, intentar renovarlo una vez
      if (response.status === 401) {
        const newToken = await refreshToken()
        if (newToken) {
          response = await doFetch(newToken)
        }
      }

      return response
    },
    [token, refreshToken]
  )

  return { apiFetch }
}
