// Provider para OpenAI - especializado en lógica de negocio

import OpenAI from "openai";
import type { AIResponse } from "../types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function generateOpenAIResponse(
  prompt: string,
  systemInstruction?: string
): Promise<AIResponse> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        ...(systemInstruction
          ? [{ role: "system" as const, content: systemInstruction }]
          : []),
        { role: "user" as const, content: prompt },
      ],
    });

    return {
      content: response.choices[0]?.message?.content || "No se pudo generar respuesta",
      provider: "openai",
      metadata: {
        model: "gpt-4o",
        usage: response.usage,
      },
    };
  } catch (error) {
    console.error("Error en OpenAI:", error);
    throw new Error(`OpenAI error: ${error}`);
  }
}

export async function analyzeLogic(
  prompt: string,
  context?: Record<string, any>
): Promise<AIResponse> {
  const systemInstruction = `Eres un experto en lógica de negocio y procesamiento de datos.
Tu especialidad es analizar procesos, cálculos, flujos lógicos, y proporcionar
recomendaciones técnicas que optimicen la funcionalidad y eficiencia.

Considera siempre:
- Validaciones y reglas de negocio
- Optimización de procesos
- Manejo de errores
- Escalabilidad
- Integridad de datos

Responde en español de manera técnica pero clara.`;

  const contextualPrompt = context
    ? `Contexto: ${JSON.stringify(context)}\n\nConsulta: ${prompt}`
    : prompt;

  return generateOpenAIResponse(contextualPrompt, systemInstruction);
}
