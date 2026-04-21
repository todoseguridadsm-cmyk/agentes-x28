/**
 * X-28 Agent Core - Parseador de Mails
 * Transforma los correos de texto plano de cuidar@x-28.com a objetos estructurados.
 */


export interface ParsedEvent {
  type: "SEÑAL_NO_RECIBIDA" | "REPORTE_EVENTOS" | "SERVICIO_TECNICO" | "MULTIPLE_EVENTS" | "DESCONOCIDO";
  priority: "ROJO" | "AMARILLO" | "AZUL" | "GRIS";
  account: string | null;
  name: string | null;
  events?: { 
    date: string; 
    description: string; 
    zone: string; 
    account?: string | null;
    name?: string | null;
    priority?: "ROJO" | "AMARILLO" | "AZUL";
    eventType?: string;
  }[];
  technicalOrder?: {
    orderNumber: string | null;
    panelModel: string | null;
    phone: string | null;
    address: string | null;
    observations: string | null;
    warranty: string | null;
  };
  rawText: string;
}

export function parseX28Email(emailText: string): ParsedEvent {
  const result: ParsedEvent = {
    type: "DESCONOCIDO",
    priority: "GRIS",
    account: null,
    name: null,
    rawText: emailText,
  };

  const cleanText = emailText.replace(/<[^>]+>/g, ' ');
  const normalizedText = cleanText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Helper para clasificar eventos
  const classify = (desc: string) => {
    const d = desc.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (d.includes("robo") || d.includes("disparo") || d.includes("alarma")) {
      return { priority: "ROJO" as const, type: "ALERTA_ROBO" };
    }
    if (d.includes("senal no recibida") || d.includes("keep alive") || d.includes("comunicacion") || d.includes("perdida de") || d.includes("fallo")) {
      return { priority: "AMARILLO" as const, type: "FALLO_COMUNICACION" };
    }
    return { priority: "AZUL" as const, type: "NORMAL" };
  };

  // 1. FORMATO: BRN-XXXX (Bulk / Masivo)
  if (cleanText.includes("BRN-")) {
    result.type = "MULTIPLE_EVENTS";
    result.events = [];
    
    // Dividimos por cada bloque que empieza con BRN-
    const blocks = cleanText.split(/(?=BRN-[A-Z0-9]{4})/);
    
    for (const block of blocks) {
      if (!block.trim()) continue;
      
      // Extraer Cuenta y Nombre de la cabecera del bloque
      // Formato: BRN-53F0 PROVIDUS S.A. - GPRS
      const headerMatch = block.match(/BRN-([A-Z0-9]+)\s+([^-]+?)\s*-\s*(GPRS|WIFI|IPR|NAIR)/i);
      const account = headerMatch ? headerMatch[1].trim() : null;
      const name = headerMatch ? headerMatch[2].trim() : null;


      // Buscar líneas de eventos dentro del bloque
      const lines = block.split('\n');
      for (const line of lines) {
        // Intentamos detectar una línea que empiece con fecha
        const dateMatch = line.match(/^(\d{2}-\d{2}-\d{4}\s\d{2}:\d{2}:\d{2})/);
        if (dateMatch) {
          const date = dateMatch[1];
          // Dividimos el resto de la línea por tabs o múltiples espacios
          const parts = line.split(/[\t]{1,}|[\s]{2,}/).map(p => p.trim()).filter(p => p.length > 0);
          
          // parts[0] es la fecha
          // parts[1] suele ser el nombre del cliente + GPRS/WIFI
          // parts[2] es la descripción del evento (Robo, Señal No Recibida, etc)
          // parts[3] es la zona (opcional)
          
          if (parts.length >= 3) {
            const description = parts[2];
            const classification = classify(description);
            
            result.events.push({
              date: date,
              description: description,
              zone: parts[3] || "",
              account: account,
              name: name,
              priority: classification.priority,
              eventType: classification.type
            });
          }
        }
      }

    }

    if (result.events.length > 0) {
      // Si todos son del mismo tipo, podríamos heredar la prioridad al objeto principal
      result.priority = result.events[0].priority || "GRIS";
      return result;
    }
  }

  // 2. FORMATO: SEÑAL NO RECIBIDA (Individual)
  if (normalizedText.includes("senal no recibida")) {
    result.type = "SEÑAL_NO_RECIBIDA";
    result.priority = "AMARILLO";
    
    const regexAccount = /En cuenta\s+([A-Za-z0-9\-]+)\s*-\s*(.*?)\s*-\s*(GPRS|WIFI|IPR|NAIR)/i;
    const match = cleanText.match(regexAccount);
    if (match) {
      result.account = match[1].trim();
      result.name = match[2].trim();
    } else {
        // Fallback si no dice "En cuenta"
        const altMatch = cleanText.match(/cuenta\s+([A-Za-z0-9\-]+)\s+-\s+([^\-]+?)\s+-\s+/i);
        if (altMatch) {
            result.account = altMatch[1].trim();
            result.name = altMatch[2].trim();
        }
    }
    return result;
  }

  // 3. FORMATO: REPORTE HISTÓRICO DE EVENTOS
  if (normalizedText.includes("reporte historico") || normalizedText.includes("historico de eventos")) {
    result.type = "REPORTE_EVENTOS";
    result.priority = "ROJO";
    
    const regexAccount = /([A-Za-z0-9\-]{4,8})\s+([^\\n]+?)\s*-\s*(GPRS|WIFI)/i;
    const match = cleanText.match(regexAccount);
    if (match) {
      result.account = match[1].trim();
      result.name = match[2].trim();
    }

    result.events = [];
    const eventRegex = /(\d{2}-\d{2}-\d{4}\s\d{2}:\d{2}:\d{2})(.*?)(\w+[\s\w]*?)\s*(?:\(\d+\))?[\s\t]*([^\n]*)/ig;
    let evMatch;
    while ((evMatch = eventRegex.exec(cleanText)) !== null) {
      const desc = evMatch[3].trim();
      const classification = classify(desc);
      result.events.push({
        date: evMatch[1].trim(),
        description: desc,
        zone: evMatch[4] ? evMatch[4].trim().substring(0, 50) : "",
        priority: classification.priority,
        eventType: classification.type
      });
    }
    return result;
  }

  // 4. FORMATO: HOJA DE SERVICIO TECNICO
  if (normalizedText.includes("hoja de servicio tecnico") || normalizedText.includes("servicio tecnico")) {
    result.type = "SERVICIO_TECNICO";
    result.priority = "AZUL";
    result.technicalOrder = {
      orderNumber: null,
      panelModel: null,
      phone: null,
      address: null,
      observations: null,
      warranty: null
    };

    const accountMatch = cleanText.match(/Cuenta\s*N:\s*([A-Za-z0-9\-\s]+?)\s*Nombre:\s*(.*?)(?:- WIFI|- GPRS|Estado de)/i);
    if (accountMatch) {
      result.account = accountMatch[1].replace(/\s+/g, '').trim(); 
      result.name = accountMatch[2].trim();
    }

    const orderMatch = cleanText.match(/Orden\s*N:\s*(\d+)/i);
    if (orderMatch && result.technicalOrder) result.technicalOrder.orderNumber = orderMatch[1];

    const modelMatch = cleanText.match(/Panel Modelo:\s*(.*?)(?:Fecha|Versi(?:ó|o)n)/i);
    if (modelMatch && result.technicalOrder) result.technicalOrder.panelModel = modelMatch[1].trim();

    const phoneMatch = cleanText.match(/Tel(?:ó|e)fono:\s*([0-9\-\s]+)/i);
    if (phoneMatch && result.technicalOrder) result.technicalOrder.phone = phoneMatch[1].trim();

    const addressMatch = cleanText.match(/Calle:\s*(.*?)(?:Localidad:|$)/i);
    if (addressMatch && result.technicalOrder) result.technicalOrder.address = addressMatch[1].trim();
    
    const obsMatch = cleanText.match(/Observaciones:\s*([\s\S]*?)(?:Acciones:|$)/i);
    if (obsMatch && result.technicalOrder) result.technicalOrder.observations = obsMatch[1].trim().replace(/\n/g, ' ');

    const warrantyMatch = cleanText.match(/garantia:\s*(.*?)(?:\(|CON GARANTIA|SIN GARANTIA)/i);
    if (warrantyMatch && result.technicalOrder) result.technicalOrder.warranty = warrantyMatch[1].trim();

    return result;
  }

  return result;
}

