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

    if (d.includes("test manual")) {
      return { priority: "GRIS" as const, type: "TEST_MANUAL" };
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
      const blockLines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      for (let i = 0; i < blockLines.length; i++) {
        const line = blockLines[i];
        const dateMatch = line.match(/^(\d{2}-\d{2}-\d{4}\s\d{2}:\d{2}:\d{2})/);
        
        if (dateMatch) {
          const date = dateMatch[1];
          let eventDescription = "";
          let eventZone = "";
          let eventName = name; // Por defecto usamos el del bloque

          // Opción 1: Todo en la misma línea (separado por tabs o muchos espacios)
          const parts = line.split(/[\t]{1,}|[\s]{2,}/).map(p => p.trim()).filter(p => p.length > 0);
          if (parts.length >= 3) {
            eventDescription = parts[2];
            eventZone = parts[3] || "";
          } 
          // Opción 2: Multi-línea (Outlook style)
          else {
            // El nombre suele estar en la siguiente línea
            if (blockLines[i+1] && !blockLines[i+1].match(/^\d{2}-\d{2}-\d{4}/)) {
              eventName = blockLines[i+1];
              // El evento en la siguiente
              if (blockLines[i+2]) {
                eventDescription = blockLines[i+2];
                // Y la zona en la que sigue si empieza con paréntesis
                if (blockLines[i+3] && blockLines[i+3].startsWith('(')) {
                  eventZone = blockLines[i+3];
                  i += 3; // Saltamos 3 líneas
                } else {
                  i += 2; // Saltamos 2 líneas
                }
              }
            }
          }

          if (eventDescription) {
            const classification = classify(eventDescription);
            result.events.push({
              date: date,
              description: eventDescription,
              zone: eventZone,
              account: account,
              name: eventName,
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


    const accountMatch = cleanText.match(/Cuenta\s*N:\s*([A-Za-z0-9\-\s]+?)\s*Nombre:\s*(.*?)(?:- WIFI|- GPRS|Estado de|\n)/i);
    if (accountMatch) {
      result.account = accountMatch[1].replace(/\s+/g, '').trim(); 
      result.name = accountMatch[2].trim();
    }


    // Extraer datos de contacto
    const addressMatch = cleanText.match(/Domicilio\s*:\s*([^\n\r]+)/i);
    const panelMatch = cleanText.match(/Modelo Panel\s*:\s*([^\n\r]+)/i);
    const obsMatch = cleanText.match(/Observaciones\s*:\s*([\s\S]*?)(?:Garantia|$)/i);
    
    // El campo Telef. es el chip del comunicador
    const chipMatch = cleanText.match(/Telef\.\s*:\s*([^\n\r]+)/i);
    
    // El celular real está en la línea de Contacto (al final)
    const contactMatch = cleanText.match(/Contacto\s*:\s*(.*?)\s+(\d{7,15})/i);

    if (result.technicalOrder) {
        result.technicalOrder.phone = contactMatch ? contactMatch[2].trim() : (chipMatch ? chipMatch[1].trim() : null);
        result.technicalOrder.address = addressMatch ? addressMatch[1].trim() : null;
        result.technicalOrder.panelModel = panelMatch ? panelMatch[1].trim() : null;
        result.technicalOrder.observations = obsMatch ? obsMatch[1].trim() : "Solicitud de servicio técnico";
    }



    const orderMatch = cleanText.match(/Orden\s*N:\s*(\d+)/i);
    if (orderMatch && result.technicalOrder) result.technicalOrder.orderNumber = orderMatch[1];

    const modelMatch = cleanText.match(/Panel Modelo:\s*(.*?)(?:Fecha|Versi(?:ó|o)n)/i);
    if (modelMatch && result.technicalOrder && !result.technicalOrder.panelModel) {
        result.technicalOrder.panelModel = modelMatch[1].trim();
    }

    const warrantyMatch = cleanText.match(/garantia:\s*(.*?)(?:\(|CON GARANTIA|SIN GARANTIA)/i);
    if (warrantyMatch && result.technicalOrder) result.technicalOrder.warranty = warrantyMatch[1].trim();

    return result;
  }


  return result;
}

