// solo variables
// O simplemente escribo el regex acá:

const cleanText = `Reporte histórico de eventos

Fecha del Reporte:	06-04-2026

Fecha	Cuenta	Evento	Usuario	Zona
BRN-211F BODEGA MONTLAIZ S.A - GPRS
Calle Lavalle 4,5 Kms Norte Montecaseros - Mendoza, Mendoza | San Martín | Montecaseros
06-04-2026 14:42:10	BODEGA MONTLAIZ S.A - GPRS	Bateria Baja		
BRN-53F0 PROVIDUS S.A. - GPRS
Coronel Moldes 546 Mendoza - Capital , Mendoza | Capital | Mendoza
06-04-2026 21:35:01	PROVIDUS S.A. - GPRS	Señal No Recibida		
Categorizacion
Control de señal de prueba
Resolución
Otros: Detalle en Observaciones
BRN-B617 SARSAR ROBERTO MARIO - WIFI
Miranda S/N (Ex Morán) Chapanay - Mendoza , Mendoza | San Martín | Chapanay
06-04-2026 06:19:26	SARSAR ROBERTO MARIO - WIFI	Robo		(2) MD96 - Galpón grande
Categorizacion
Alarma Falsa - Motivo de disparo no det.
Resolución
Despacho a Policia local
BRN-35FE MAIZ MATÍAS - WIFI
Finca el Chanal en calle Anzorena esquina Calderón S/N Montecaseros - Mendoza, Mendoza | San Martín | Montecaseros
06-04-2026 21:11:44	MAIZ MATÍAS - WIFI	Pérdida de Keep Alive (IPR28/NAIR)		
Categorizacion
Control de enlace GPRS (Keep Alive)
Resolución
Otros: Detalle en Observaciones`;

const normalizedText = cleanText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const eventRegex = /(\d{2}-\d{2}-\d{4}\s\d{2}:\d{2}:\d{2})(.*?)Robo[\s\t]*(?:\(\d+\))?[\s\t]*([^\n]+)/ig;
let evMatch;
let events = [];
while ((evMatch = eventRegex.exec(cleanText)) !== null) {
   events.push({
      date: evMatch[1].trim(),
      description: "Robo detectado",
      zone: evMatch[3].trim().substring(0, 50)
   });
}
console.log("Robos extraidos:", events);
