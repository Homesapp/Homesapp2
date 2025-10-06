// Dispatcher que decide qué AI usar según el tipo de consulta

import type { AIRequest, AIResponse, CollaborativeResponse, IntentType } from "./types";
import { analyzeUXUI } from "./providers/gemini";
import { analyzeLogic } from "./providers/openai";

// Clasificador de intenciones basado en palabras clave
export function classifyIntent(prompt: string): IntentType {
  const lowerPrompt = prompt.toLowerCase();

  // Palabras clave para UX/UI
  const uxKeywords = [
    "diseño",
    "interfaz",
    "usuario",
    "visual",
    "experiencia",
    "ux",
    "ui",
    "botón",
    "color",
    "layout",
    "navegación",
    "accesibilidad",
    "usabilidad",
    "responsive",
    "móvil",
    "flujo",
    "formulario",
    "pantalla",
    "vista",
  ];

  // Palabras clave para lógica
  const logicKeywords = [
    "calcular",
    "validar",
    "proceso",
    "algoritmo",
    "función",
    "lógica",
    "base de datos",
    "api",
    "backend",
    "optimizar",
    "rendimiento",
    "datos",
    "consulta",
    "transacción",
    "integración",
  ];

  const uxScore = uxKeywords.filter((kw) => lowerPrompt.includes(kw)).length;
  const logicScore = logicKeywords.filter((kw) => lowerPrompt.includes(kw)).length;

  if (uxScore > 0 && logicScore > 0) {
    return "mixed";
  } else if (uxScore > logicScore) {
    return "ux-ui";
  } else if (logicScore > uxScore) {
    return "logic";
  } else {
    return "mixed";
  }
}

// Dispatcher principal que enruta a la AI correcta
export async function dispatchAIRequest(request: AIRequest): Promise<AIResponse> {
  const intentType = request.intentType || classifyIntent(request.prompt);

  switch (intentType) {
    case "ux-ui":
      return analyzeUXUI(request.prompt, request.context);
    case "logic":
      return analyzeLogic(request.prompt, request.context);
    case "mixed":
      if (request.collaborationMode) {
        const collaborative = await collaborateAIs(request);
        return {
          content: collaborative.finalDecision,
          provider: "gemini",
          metadata: {
            collaborative: true,
            geminiOpinion: collaborative.geminiOpinion?.content,
            openaiOpinion: collaborative.openaiOpinion?.content,
            reasoning: collaborative.reasoning,
          },
        };
      } else {
        return analyzeUXUI(request.prompt, request.context);
      }
    default:
      throw new Error(`Intent type no soportado: ${intentType}`);
  }
}

// Modo colaborativo: ambas IAs opinan y se genera una decisión final
export async function collaborateAIs(
  request: AIRequest
): Promise<CollaborativeResponse> {
  try {
    const [geminiResponse, openaiResponse] = await Promise.all([
      analyzeUXUI(request.prompt, request.context),
      analyzeLogic(request.prompt, request.context),
    ]);

    const synthesisPrompt = `He recibido dos opiniones sobre la siguiente consulta:

CONSULTA: ${request.prompt}

OPINIÓN GEMINI (UX/UI): ${geminiResponse.content}

OPINIÓN OPENAI (LÓGICA): ${openaiResponse.content}

Por favor, sintetiza ambas opiniones en una recomendación final coherente que:
1. Combine los mejores aspectos de ambas perspectivas
2. Resuelva cualquier contradicción explicando el razonamiento
3. Proporcione una guía clara y accionable

Responde en español.`;

    const finalDecision = await analyzeLogic(synthesisPrompt);

    return {
      geminiOpinion: geminiResponse,
      openaiOpinion: openaiResponse,
      finalDecision: finalDecision.content,
      reasoning: "Síntesis de ambas perspectivas: UX/UI y Lógica",
    };
  } catch (error) {
    console.error("Error en colaboración de AIs:", error);
    throw error;
  }
}
