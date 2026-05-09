export interface Source {
  filename?: string
  page?: number
  snippet?: string
  score?: number
  title?: string
  url?: string
}

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: Source[]
  timestamp: number
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

export type AgentStatus = 
  | "idle" 
  | "thinking" 
  | "searching" 
  | "analyzing" 
  | "generating"

export interface SSEEvent {
  type: "status" | "sources" | "token" | "error" | "done"
  data: string | Source[] | { message: string }
}
