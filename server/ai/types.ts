// Tipos para el sistema dual-AI: Gemini (UX/UI) + OpenAI (Lógica)

export type AIProvider = "gemini" | "openai";

export type IntentType = "ux-ui" | "logic" | "mixed";

export interface AIRequest {
  prompt: string;
  context?: Record<string, any>;
  intentType?: IntentType;
  collaborationMode?: boolean;
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface CollaborativeResponse {
  geminiOpinion?: AIResponse;
  openaiOpinion?: AIResponse;
  finalDecision: string;
  reasoning: string;
}
