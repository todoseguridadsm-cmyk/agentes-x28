
import { parseX28Email } from './src/lib/parser.js';

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
