"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Spinner } from "@/components/ui/spinner"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace("/chat")
      } else {
        router.replace("/login")
      }
    }
  }, [user, loading, router])

  return (
    <div className="flex h-screen items-center justify-center">
      <Spinner className="size-8" />
    </div>
  )
}
