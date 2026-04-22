
import { parseX28Email } from '../src/lib/parser.js';

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
