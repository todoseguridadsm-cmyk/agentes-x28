
function parseX28Email(text) {
  // Versión simplificada del parser para testear el bloque BRN
  const events = [];
  const lines = text.split('\n');
  let currentBlock = null;

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detectar inicio de bloque BRN
    if (trimmed.startsWith('BRN-')) {
      currentBlock = {
        header: trimmed,
        account: trimmed.split(' ')[0],
        name: trimmed.substring(trimmed.indexOf(' ') + 1).trim()
      };
      continue;
    }

    // Detectar línea de evento
    const dateMatch = trimmed.match(/^(\d{2}-\d{2}-\d{4}\s\d{2}:\d{2}:\d{2})\s+(.+)\s+(Robo|Asalto|Pánico|Emergencia|Señal No Recibida|Pérdida de enlace|Bateria Baja|Servicio Técnico|Corte de Red|Fallo de comunicación)/i);
    
    if (dateMatch && currentBlock) {
       events.push({
         account: currentBlock.account,
         name: currentBlock.name,
         date: dateMatch[1],
         description: dateMatch[3],
         priority: (dateMatch[3].match(/Robo|Asalto|Pánico/i)) ? "ROJO" : 
                   (dateMatch[3].match(/Señal|Pérdida|Fallo/i)) ? "AMARILLO" : "AZUL"
       });
    }
  }

  return events.length > 0 ? { type: "MULTIPLE_EVENTS", events } : { type: "DESCONOCIDO" };
}

const realEmail = `Reporte histórico de eventos
________________________________

Fecha del Reporte:
28-03-2026

Fecha
Cuenta
Evento
Usuario
Zona
BRN-5EFB SPIES, WALTER GERMAN - GPRS
Sargento Cabral 407 San Martin - Mendoza, Mendoza | San Martín | San Martín
28-03-2026 13:38:31
SPIES, WALTER GERMAN - GPRS
Robo
(3) MD96 - Patio trasero
Categorizacion
Existe evento en curso
Resolución
Sigue en otro evento (ver obs.)
28-03-2026 13:38:29
SPIES, WALTER GERMAN - GPRS
Robo
(3) MD96 - Patio trasero`;

const result = parseX28Email(realEmail);
console.log(JSON.stringify(result, null, 2));
