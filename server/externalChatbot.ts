import { storage } from "./storage";

interface ChatbotParams {
  agencyId: string;
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  clientInfo?: { name?: string; phone?: string; email?: string };
}

interface PropertySearchParams {
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  propertyType?: string;
  location?: string;
  listingType?: 'rent' | 'sale' | 'both';
  limit?: number;
}

interface ScheduleViewingParams {
  unitId?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone: string;
  preferredDate?: string;
  preferredTime?: string;
  notes?: string;
}

export const chatbotTools = [
  {
    type: "function" as const,
    function: {
      name: "search_properties",
      description: "Buscar propiedades disponibles según criterios como precio, ubicación, número de recámaras, tipo de propiedad",
      parameters: {
        type: "object",
        properties: {
          minPrice: { type: "number", description: "Precio mínimo en MXN" },
          maxPrice: { type: "number", description: "Precio máximo en MXN" },
          bedrooms: { type: "number", description: "Número de recámaras" },
          propertyType: { type: "string", description: "Tipo de propiedad: departamento, casa, estudio, penthouse" },
          location: { type: "string", description: "Ubicación o zona: Aldea Zama, La Veleta, Region 15, Centro, etc." },
          listingType: { type: "string", enum: ["rent", "sale", "both"], description: "Tipo de listado: rent (renta), sale (venta), both (ambos)" },
          limit: { type: "number", description: "Número máximo de resultados a mostrar (default: 5)" }
        },
        required: []
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_property_details",
      description: "Obtener detalles completos de una propiedad específica por su ID o número de unidad",
      parameters: {
        type: "object",
        properties: {
          unitId: { type: "string", description: "ID de la unidad" },
          unitNumber: { type: "string", description: "Número de la unidad" }
        },
        required: []
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "schedule_viewing",
      description: "Agendar una cita para ver una propiedad. Requiere información del cliente y fecha/hora deseada.",
      parameters: {
        type: "object",
        properties: {
          unitId: { type: "string", description: "ID de la propiedad a visitar" },
          clientName: { type: "string", description: "Nombre completo del cliente" },
          clientEmail: { type: "string", description: "Email del cliente" },
          clientPhone: { type: "string", description: "Teléfono del cliente" },
          preferredDate: { type: "string", description: "Fecha preferida en formato YYYY-MM-DD" },
          preferredTime: { type: "string", description: "Hora preferida en formato HH:MM (24h)" },
          notes: { type: "string", description: "Notas adicionales sobre la visita" }
        },
        required: ["clientName", "clientPhone"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_available_times",
      description: "Obtener horarios disponibles para agendar citas en una fecha específica",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "Fecha en formato YYYY-MM-DD" }
        },
        required: ["date"]
      }
    }
  }
];

export async function searchProperties(agencyId: string, params: PropertySearchParams) {
  const { minPrice, maxPrice, bedrooms, propertyType, location, listingType, limit = 5 } = params;
  
  const allUnits = await storage.getExternalUnitsByAgency(agencyId);
  
  let filteredUnits = allUnits.filter((unit: any) => {
    if (unit.status === 'rented' || unit.status === 'occupied') return false;
    if (minPrice && unit.price && unit.price < minPrice) return false;
    if (maxPrice && unit.price && unit.price > maxPrice) return false;
    if (bedrooms && unit.bedrooms !== bedrooms) return false;
    if (listingType && unit.listingType && unit.listingType !== listingType && unit.listingType !== 'both') return false;
    return true;
  });

  if (location) {
    const searchTerm = location.toLowerCase();
    filteredUnits = filteredUnits.filter((unit: any) => {
      const unitText = `${unit.unitNumber || ''} ${unit.address || ''} ${unit.zone || ''} ${unit.description || ''}`.toLowerCase();
      return unitText.includes(searchTerm);
    });
  }

  if (propertyType) {
    const typeSearch = propertyType.toLowerCase();
    filteredUnits = filteredUnits.filter((unit: any) => {
      const unitType = (unit.propertyType || unit.unitNumber || '').toLowerCase();
      return unitType.includes(typeSearch);
    });
  }

  const results = filteredUnits.slice(0, limit);

  if (results.length === 0) {
    return { 
      success: true, 
      count: 0, 
      message: "No encontré propiedades que coincidan con esos criterios. ¿Te gustaría ampliar la búsqueda?"
    };
  }

  return {
    success: true,
    count: results.length,
    totalAvailable: filteredUnits.length,
    properties: results.map((unit: any) => ({
      id: unit.id,
      unitNumber: unit.unitNumber,
      price: unit.price,
      currency: unit.currency || 'MXN',
      bedrooms: unit.bedrooms,
      bathrooms: unit.bathrooms,
      size: unit.size,
      sizeUnit: unit.sizeUnit || 'm²',
      address: unit.address,
      zone: unit.zone,
      listingType: unit.listingType,
      amenities: unit.amenities,
      description: unit.description?.substring(0, 200)
    }))
  };
}

export async function getPropertyDetails(agencyId: string, params: { unitId?: string; unitNumber?: string }) {
  const { unitId, unitNumber } = params;
  
  // Always search within the agency's units to ensure multi-tenant isolation
  const allUnits = await storage.getExternalUnitsByAgency(agencyId);
  
  let unit;
  if (unitId) {
    // Validate unit belongs to this agency
    unit = allUnits.find((u: any) => u.id === unitId);
  } else if (unitNumber) {
    unit = allUnits.find((u: any) => u.unitNumber?.toLowerCase() === unitNumber.toLowerCase());
  }

  if (!unit) {
    return { success: false, message: "No encontré esa propiedad. ¿Podrías verificar el número o ID?" };
  }

  return {
    success: true,
    property: {
      id: unit.id,
      unitNumber: unit.unitNumber,
      price: unit.price,
      salePrice: unit.salePrice,
      currency: unit.currency || 'MXN',
      bedrooms: unit.bedrooms,
      bathrooms: unit.bathrooms,
      size: unit.size,
      sizeUnit: unit.sizeUnit || 'm²',
      address: unit.address,
      zone: unit.zone,
      listingType: unit.listingType,
      amenities: unit.amenities,
      description: unit.description,
      furnished: unit.furnished,
      petFriendly: unit.petFriendly,
      parkingSpaces: unit.parkingSpaces,
      availableFrom: unit.availableFrom,
      googleMapsUrl: unit.googleMapsUrl,
      status: unit.status
    }
  };
}

export async function scheduleViewing(agencyId: string, params: ScheduleViewingParams) {
  const { unitId, clientName, clientEmail, clientPhone, preferredDate, preferredTime, notes } = params;

  // Validate unit belongs to this agency if unitId is provided
  let validatedUnitId: string | undefined;
  if (unitId) {
    const agencyUnits = await storage.getExternalUnitsByAgency(agencyId);
    const validUnit = agencyUnits.find((u: any) => u.id === unitId);
    if (!validUnit) {
      return {
        success: false,
        message: "No encontré esa propiedad en nuestro inventario. ¿Podrías verificar cuál propiedad te interesa?"
      };
    }
    validatedUnitId = validUnit.id;
  }

  let leadId: string | undefined;
  try {
    const existingLeads = await storage.getExternalLeadsByAgency(agencyId);
    const existingLead = existingLeads.find((l: any) => 
      l.phone === clientPhone || (clientEmail && l.email === clientEmail)
    );

    if (existingLead) {
      leadId = existingLead.id;
    } else {
      const nameParts = clientName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const newLead = await storage.createExternalLead({
        agencyId,
        firstName,
        lastName,
        email: clientEmail || null,
        phone: clientPhone,
        source: 'chatbot',
        status: 'new',
        notes: `Lead creado automáticamente por chatbot. ${notes || ''}`
      });
      leadId = newLead.id;
    }
  } catch (err) {
    console.error("Error creating lead for chatbot:", err);
  }

  try {
    const showingDate = preferredDate ? new Date(preferredDate) : new Date();
    if (preferredTime) {
      const [hours, minutes] = preferredTime.split(':');
      showingDate.setHours(parseInt(hours), parseInt(minutes));
    }

    if (leadId && validatedUnitId) {
      await storage.createExternalLeadShowing({
        leadId,
        externalUnitId: validatedUnitId,
        scheduledDate: showingDate,
        status: 'scheduled',
        notes: notes || 'Cita agendada via chatbot'
      });
    }

    return {
      success: true,
      message: `¡Perfecto! He registrado tu solicitud de visita para ${clientName}. Un agente se pondrá en contacto contigo pronto al ${clientPhone} para confirmar la cita.`,
      appointmentDetails: {
        clientName,
        clientPhone,
        preferredDate,
        preferredTime,
        status: 'pending_confirmation'
      }
    };
  } catch (err) {
    console.error("Error scheduling viewing:", err);
    return {
      success: false,
      message: "Hubo un problema al agendar la cita. Por favor intenta de nuevo o contacta directamente a la agencia."
    };
  }
}

export function getAvailableTimes(params: { date: string }) {
  const { date } = params;
  const times = [
    "09:00", "10:00", "11:00", "12:00", 
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
  ];
  
  return {
    success: true,
    date,
    availableTimes: times,
    message: `Para el ${date}, tenemos disponibilidad en los siguientes horarios: ${times.join(', ')}. ¿Cuál te conviene mejor?`
  };
}

export function buildSystemPrompt(agencyName: string): string {
  return `Eres el asistente virtual de ${agencyName}, una agencia inmobiliaria en Tulum, México. Tu objetivo es ayudar a clientes potenciales a encontrar propiedades y agendar visitas.

CAPACIDADES:
1. Buscar propiedades disponibles según criterios (precio, recámaras, ubicación, tipo)
2. Mostrar detalles de propiedades específicas
3. Agendar citas para visitar propiedades
4. Responder preguntas sobre el proceso de renta/compra

INSTRUCCIONES IMPORTANTES:
- Siempre responde en español de manera amigable y profesional
- Cuando el cliente pregunte por propiedades, USA LA FUNCIÓN search_properties para obtener datos reales
- Cuando el cliente quiera agendar una visita, solicita: nombre, teléfono, y fecha/hora preferida
- Presenta las propiedades de forma atractiva mencionando: precio, recámaras, ubicación y características destacadas
- Si no hay propiedades que coincidan, sugiere ampliar los criterios de búsqueda
- Para agendar citas, SIEMPRE solicita al menos nombre y teléfono del cliente
- Cuando muestres propiedades, formatea la información de manera clara y atractiva

ZONAS POPULARES EN TULUM:
- Aldea Zama: zona premium con amenidades de lujo
- La Veleta: zona residencial tranquila
- Region 15: excelente ubicación céntrica  
- Centro: cerca de todo, zona comercial
- Holistika: comunidad ecológica

PROCESO DE RENTA:
1. Búsqueda y visita de propiedades
2. Solicitud de renta con documentos
3. Firma de contrato y depósito
4. Entrega de llaves

FORMATO PARA MOSTRAR PROPIEDADES:
Cuando muestres propiedades, usa este formato:
🏠 [Nombre/Número de Unidad]
💰 Precio: $X,XXX MXN/mes
🛏️ Recámaras: X | 🚿 Baños: X
📍 Zona: [Ubicación]
📐 Tamaño: X m²
✨ Características: [Lista de amenidades]

Siempre mantén un tono cálido y servicial. Tu meta es ayudar al cliente a encontrar su próximo hogar.`;
}

export async function processExternalChatbotMessage(params: ChatbotParams) {
  const { agencyId, message, conversationHistory } = params;

  const OpenAI = (await import("openai")).default;
  const openai = new OpenAI({
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
  });

  const agency = await storage.getExternalAgency(agencyId);
  const agencyName = agency?.name || 'Agencia';
  const systemPrompt = buildSystemPrompt(agencyName);

  const messages: any[] = [
    { role: "system", content: systemPrompt },
    ...(conversationHistory || []).map((m: any) => ({
      role: m.role,
      content: m.content
    })),
    { role: "user", content: message }
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    tools: chatbotTools,
    tool_choice: "auto",
    max_tokens: 1000,
    temperature: 0.7,
  });

  let assistantMessage = completion.choices[0]?.message;
  
  if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
    messages.push(assistantMessage);

    for (const toolCall of assistantMessage.tool_calls) {
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);
      
      let functionResult;
      switch (functionName) {
        case 'search_properties':
          functionResult = await searchProperties(agencyId, functionArgs);
          break;
        case 'get_property_details':
          functionResult = await getPropertyDetails(agencyId, functionArgs);
          break;
        case 'schedule_viewing':
          functionResult = await scheduleViewing(agencyId, functionArgs);
          break;
        case 'get_available_times':
          functionResult = getAvailableTimes(functionArgs);
          break;
        default:
          functionResult = { error: "Unknown function" };
      }

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(functionResult)
      });
    }

    const finalCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    assistantMessage = finalCompletion.choices[0]?.message;
  }

  return assistantMessage?.content || "Lo siento, no pude procesar tu mensaje. Por favor, intenta de nuevo.";
}
