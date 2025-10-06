// Provider para Google Gemini - especializado en UX/UI
// DON'T DELETE THIS COMMENT - usando blueprint:javascript_gemini

import { GoogleGenAI } from "@google/genai";
import type { AIResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateGeminiResponse(
  prompt: string,
  systemInstruction?: string
): Promise<AIResponse> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: systemInstruction ? { systemInstruction } : undefined,
      contents: prompt,
    });

    return {
      content: response.text || "No se pudo generar respuesta",
      provider: "gemini",
      metadata: {
        model: "gemini-2.5-flash",
      },
    };
  } catch (error) {
    console.error("Error en Gemini:", error);
    throw new Error(`Gemini error: ${error}`);
  }
}

export async function analyzeUXUI(
  prompt: string,
  context?: Record<string, any>
): Promise<AIResponse> {
  const systemInstruction = `Eres un experto en UX/UI y diseño de experiencias de usuario.
Tu especialidad es analizar interfaces, flujos de usuario, y proporcionar recomendaciones
de diseño que mejoren la usabilidad y experiencia del usuario.

Considera siempre:
- Accesibilidad
- Claridad visual
- Flujos intuitivos
- Mejores prácticas de diseño
- Experiencia móvil y responsive

Responde en español de manera clara y práctica.`;

  const contextualPrompt = context
    ? `Contexto: ${JSON.stringify(context)}\n\nConsulta: ${prompt}`
    : prompt;

  return generateGeminiResponse(contextualPrompt, systemInstruction);
}
