"use client"

import { Brain, Search, FileSearch, Sparkles } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import type { AgentStatus } from "@/types/chat"
import { cn } from "@/lib/utils"

interface StatusIndicatorProps {
  status: AgentStatus
  className?: string
}

const statusConfig: Record<
  Exclude<AgentStatus, "idle">,
  { icon: React.ElementType; label: string; color: string }
> = {
  thinking: {
    icon: Brain,
    label: "Pensando...",
    color: "text-blue-500",
  },
  searching: {
    icon: Search,
    label: "Buscando documentos...",
    color: "text-amber-500",
  },
  analyzing: {
    icon: FileSearch,
    label: "Analizando contenido...",
    color: "text-purple-500",
  },
  generating: {
    icon: Sparkles,
    label: "Generando respuesta...",
    color: "text-green-500",
  },
}

export function StatusIndicator({ status, className }: StatusIndicatorProps) {
  if (status === "idle") return null

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2",
        className
      )}
    >
      <Spinner className={cn("size-4", config.color)} />
      <Icon className={cn("size-4", config.color)} />
      <span className="text-sm text-muted-foreground">{config.label}</span>
    </div>
  )
}
