
function parseX28Email(emailText) {
  const result = {
    type: "DESCONOCIDO",
    priority: "GRIS",
    account: null,
    name: null,
    rawText: emailText,
  };

  const cleanText = emailText.replace(/<[^>]+>/g, ' ');
  const normalizedText = cleanText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 1. FORMATO: SEÑAL NO RECIBIDA
  if (normalizedText.includes("senal no recibida")) {
    result.type = "SEÑAL_NO_RECIBIDA";
    result.priority = "AMARILLO";
    
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
    const eventRegex = /(\d{2}-\d{2}-\d{4}\s\d{2}:\d{2}:\d{2})(.*?)Robo[\s\t]*(?:\(\d+\))?[\s\t]*([^\n]+)/ig;
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
    // ... (rest of logic)
    return result;
  }

  return result;
}

const example1 = `X-28 ALARMAS le informa : En cuenta CC92 - SANYI S.R.L. - GPRS se ha generado una Señal No Recibida a las 05:55:00 del dia 2026-04-14. Por consultas comuniquese al 0810-5555-666. Muchas Gracias.`;

const example2 = `BRN-53F0 PROVIDUS S.A. - GPRS
Coronel Moldes 546 Mendoza - Capital , Mendoza | Capital | Mendoza
13-04-2026 23:40:00	PROVIDUS S.A. - GPRS	Señal No Recibida		
Categorizacion
Control de enlace GPRS (Keep Alive)
Resolución
Se eleva a Servicio Tecnico
BRN-3D59 GOGOL, MARISA- GPRS
Carril Norte S/N Buen orden - Mendoza , Mendoza | San Martín | Buen Orden
13-04-2026 13:55:06	GOGOL, MARISA- GPRS	Robo		(1) MD96 - Entrada
Categorizacion
Alarma Falsa - Motivo de disparo no det.
Resolución
Despacho a Policia local`;

console.log("--- Example 1 ---");
console.log(JSON.stringify(parseX28Email(example1), null, 2));

console.log("\n--- Example 2 ---");
console.log(JSON.stringify(parseX28Email(example2), null, 2));
