"use client"

import { useState, useEffect } from "react"
import { FileText, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { Source } from "@/types/chat"

interface SourceCardsProps {
  sources: Source[]
}

export function SourceCards({ sources }: SourceCardsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (sources.length === 0) return null

  const displayedSources = isExpanded ? sources : sources.slice(0, 2)
  const hasMore = sources.length > 2

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <FileText className="size-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          {sources.length} fuente{sources.length !== 1 ? "s" : ""} consultada{sources.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {displayedSources.map((source, index) => (
          <SourceCard key={index} source={source} />
        ))}
      </div>

      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-xs"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="size-3" />
              Mostrar menos
            </>
          ) : (
            <>
              <ChevronDown className="size-3" />
              Ver {sources.length - 2} fuente{sources.length - 2 !== 1 ? "s" : ""} mas
            </>
          )}
        </Button>
      )}
    </div>
  )
}

function SourceCard({ source }: { source: Source }) {
  const [isMobile, setIsMobile] = useState(false)
  const title = source.filename || source.title || "Fuente RAG"
  const hasUrl = !!source.url && source.url !== "#"

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const cardElement = (
    <Card
      className={cn(
        "cursor-pointer transition-colors hover:bg-muted/50",
        "border-l-2 border-l-primary/50"
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{title}</p>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {hasUrl 
                ? (isMobile ? "Clic para abrir en nueva pestaña." : "Clic para ver el documento original.") 
                : (source.snippet || "Sin detalles adicionales.")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (hasUrl) {
    if (isMobile) {
      return (
        <a href={source.url} target="_blank" rel="noopener noreferrer" className="block">
          {cardElement}
        </a>
      )
    }

    return (
      <Dialog>
        <DialogTrigger asChild>
          {cardElement}
        </DialogTrigger>
        <DialogContent className="max-w-4xl h-[85vh] p-0 flex flex-col gap-0">
          <DialogHeader className="p-4 pb-2 border-b">
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 bg-muted/20 p-4">
            <iframe 
              src={source.url} 
              className="w-full h-full rounded border shadow-sm bg-white" 
              title={title} 
            />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return cardElement
}
