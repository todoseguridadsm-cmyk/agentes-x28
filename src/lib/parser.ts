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

  // Limpieza inicial: quitamos etiquetas HTML en caso de que Zapier mande body_html por error.
  const cleanText = emailText.replace(/<[^>]+>/g, ' ');
  // Texto normalizado: minúsculas y sin tildes para búsqueda flexible
  const normalizedText = cleanText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 1. FORMATO: SEÑAL NO RECIBIDA
  if (normalizedText.includes("senal no recibida")) {
    result.type = "SEÑAL_NO_RECIBIDA";
    result.priority = "AMARILLO";
    
    // Usamos el cleanText por si venía con HTML
    const regexAccount = /En cuenta\s+([A-Za-z0-9\-]+)\s*-\s*(.*?)\s*-\s*GPRS/i;
    const match = cleanText.match(regexAccount);
    if (match) {
      result.account = match[1].trim();
      result.name = match[2].trim();
    }
    return result;
  }

  // 2. FORMATO: REPORTE HISTÓRICO DE EVENTOS
  if (normalizedText.includes("reporte historico de eventos") || normalizedText.includes("historico de eventos")) {
    result.type = "REPORTE_EVENTOS";
    result.priority = "ROJO";
    
    const regexAccount = /([A-Za-z0-9\-]{4,8})\s+([^\\n]+?)\s*-\s*GPRS/i;
    const match = cleanText.match(regexAccount);
    if (match) {
      result.account = match[1].trim();
      result.name = match[2].trim();
    }

    result.events = [];
    const eventRegex = /(\d{2}-\d{2}-\d{4}\s\d{2}:\d{2}:\d{2})(.*?)Robo\(\d+\)\s([^\n]+)/ig;
    let evMatch;
    while ((evMatch = eventRegex.exec(cleanText)) !== null) {
      result.events.push({
        date: evMatch[1].trim(),
        description: "Robo detectado",
        zone: evMatch[3].trim().substring(0, 50)
      });
    }
    return result;
  }

  // 3. FORMATO: HOJA DE SERVICIO TECNICO
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
    
    // Tratamos de buscar la parte de las observaciones
    const obsMatch = cleanText.match(/Observaciones:\s*([\s\S]*?)(?:Acciones:|$)/i);
    if (obsMatch && result.technicalOrder) result.technicalOrder.observations = obsMatch[1].trim().replace(/\n/g, ' ');

    const warrantyMatch = cleanText.match(/garantia:\s*(.*?)(?:\(|CON GARANTIA|SIN GARANTIA)/i);
    if (warrantyMatch && result.technicalOrder) result.technicalOrder.warranty = warrantyMatch[1].trim();

    return result;
  }

  return result;
}
