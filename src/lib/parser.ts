/**
 * X-28 Agent Core - Parseador de Mails
 * Transforma los correos de texto plano de cuidar@x-28.com a objetos estructurados.
 */

export interface ParsedEvent {
  type: "SEÑAL_NO_RECIBIDA" | "REPORTE_EVENTOS" | "SERVICIO_TECNICO" | "DESCONOCIDO";
  priority: "ROJO" | "AMARILLO" | "AZUL" | "GRIS";
  account: string | null;
  name: string | null;
  events?: { date: string; description: string; zone: string }[];
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

  // 1. FORMATO: SEÑAL NO RECIBIDA
  if (emailText.includes("Señal No Recibida")) {
    result.type = "SEÑAL_NO_RECIBIDA";
    result.priority = "AMARILLO";
    
    // Ejemplo: "En cuenta 729C - MONDELLO SRL - GPRS se ha generado una Señal No Recibida a las 20:30:00 del dia 2026-04-19."
    const regexAccount = /En cuenta\s+([A-Z0-9\-]+)\s*-\s*(.*?)\s*-\s*GPRS/i;
    const match = emailText.match(regexAccount);
    if (match) {
      result.account = match[1].trim();
      result.name = match[2].trim();
    }
    return result;
  }

  // 2. FORMATO: REPORTE HISTÓRICO DE EVENTOS
  if (emailText.includes("Reporte histórico de eventos")) {
    result.type = "REPORTE_EVENTOS";
    result.priority = "ROJO"; // Asumimos rojo porque agrupa robos, se puede afinar
    
    // Ejemplo de línea base cuenta: "BRN-FE57 OCHOA, GABRIELA BEATRIZ - GPRS"
    // Buscamos patrones de Cuenta + Nombre
    const regexAccount = /([A-Z0-9\-]{4,8})\s+([^\\n]+?)\s*-\s*GPRS/i;
    const match = emailText.match(regexAccount);
    if (match) {
      result.account = match[1].trim();
      result.name = match[2].trim();
    }

    // Extracción de eventos múltiples
    result.events = [];
    const eventRegex = /(\d{2}-\d{2}-\d{4}\s\d{2}:\d{2}:\d{2})(.*?)Robo\(\d+\)\s([^\n]+)/g;
    let evMatch;
    while ((evMatch = eventRegex.exec(emailText)) !== null) {
      result.events.push({
        date: evMatch[1].trim(),
        description: "Robo detectado",
        zone: evMatch[3].trim()
      });
    }
    return result;
  }

  // 3. FORMATO: HOJA DE SERVICIO TECNICO
  if (emailText.includes("HOJA DE SERVICIO TECNICO")) {
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

    // Extraer Cuenta y Nombre (Ej: "Cuenta N: BRN 0D02 Nombre: PERSIA GIMENA - WIFI")
    const accountMatch = emailText.match(/Cuenta\s*N:\s*([A-Z0-9\-\s]+?)\s*Nombre:\s*(.*?)(?:- WIFI|- GPRS|Estado de)/i);
    if (accountMatch) {
      result.account = accountMatch[1].replace(/\s+/g, '').trim(); // Dejar "BRN0D02"
      result.name = accountMatch[2].trim();
    }

    const orderMatch = emailText.match(/Orden\s*N:\s*(\d+)/i);
    if (orderMatch && result.technicalOrder) result.technicalOrder.orderNumber = orderMatch[1];

    const modelMatch = emailText.match(/Panel Modelo:\s*(.*?)(?:Fecha|Versi(?:ó|o)n)/i);
    if (modelMatch && result.technicalOrder) result.technicalOrder.panelModel = modelMatch[1].trim();

    const phoneMatch = emailText.match(/Tel(?:ó|e)fono:\s*([0-9\-\s]+)/i);
    if (phoneMatch && result.technicalOrder) result.technicalOrder.phone = phoneMatch[1].trim();

    const addressMatch = emailText.match(/Calle:\s*(.*?)(?:Localidad:|$)/i);
    if (addressMatch && result.technicalOrder) result.technicalOrder.address = addressMatch[1].trim();
    
    const obsMatch = emailText.match(/Observaciones:\s*([\s\S]*?)(?:Acciones:|$)/i);
    if (obsMatch && result.technicalOrder) result.technicalOrder.observations = obsMatch[1].trim().replace(/\n/g, ' ');

    const warrantyMatch = emailText.match(/garantia:\s*(.*?)(?:\(|CON GARANTIA|SIN GARANTIA)/i);
    if (warrantyMatch && result.technicalOrder) result.technicalOrder.warranty = warrantyMatch[1].trim();

    return result;
  }

  return result;
}
