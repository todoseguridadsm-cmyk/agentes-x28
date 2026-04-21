const REPORTE = `Reporte histórico de eventos

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

const HOJA = `No hay datos de visita
No hay una visita asignada

HOJA DE SERVICIO TECNICO
Orden N: 253738
Fecha de alta del servicio: 12/28/2025 2:45:32 PM;
Fecha de modificacion del servicio: 12/28/2025 2:45:32 PM
Vencimiento de garantia: 15/1/2023 12:00:00 AM ( SIN GARANTIA )
Orden generada por: Matias Bertón

DATOS DEL CLIENTE
Cuenta N: BRN 53F0 Nombre: PROVIDUS S.A. - GPRS
Estado de garantia: SIN GARANTIA	Fecha de Alta de la Cuenta: 2019-12-09 20:30:28
Calle: Coronel Moldes 546	Localidad: Mendoza - Capital
Provincia/Estado: Mendoza | Capital | Mendoza	Ubicación: Entre calles: Granaderos y Alpatacal Barrio: 6° Sección
Teléfono: 1140993716	Contacto: Nadler, Gisel 0261155124317
Panel Modelo:	
Fecha del ultimo servicio:	Estado del ultimo servicio:
Información de servicio
Estado del servicio: Pendiente	Nuevo estado:
Fecha de 1er visita: N/A
Forma de viaje:
Tecnico asignado:	Forma de viaje:
Servicio: Fallas de comunicación (Correctivo)
Movil:

Cronograma de visita
Hora de salida hacia el cliente:
Hora de arribo al cliente:
Hora de salida del cliente:
INSUMOS
Cantidad	Descripción	Observaciones
Estado	X	Pendiente		Cancelado		Finalizado
Valor :
Observaciones: sin reportar en central
Acciones:
2025-12-28 14:45:32	sin reportar en central	Alta

CONFORMIDAD DEL SERVICIO
Cliente	Tecnico
Firma	Firma
Aclaración	Aclaración`;

const SENAL = `X-28 ALARMAS le informa : En cuenta 76F0 - BARTOLOME, MARCELO ALEJANDRO - GPRS se ha generado una Señal No Recibida a las 02:55:00 del dia 2026-04-17. Por consultas comuniquese al 0810-5555-666. Muchas Gracias`;

async function inject(texto) {
   const url = "https://plataforma-agencias-x28.vercel.app/api/webhook/email?token=webhook_xtoken_wo01h7ho";
   const payload = { body_plain: texto };
   const res = await fetch(url, {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify(payload)
   });
   console.log("Respuesta:", await res.text());
}

async function run() {
   console.log("Inyectando 1/3 (Reporte de Robo)...");
   await inject(REPORTE);
   console.log("Inyectando 2/3 (Hoja de Servicio)...");
   await inject(HOJA);
   console.log("Inyectando 3/3 (Señal no recibida)...");
   await inject(SENAL);
}

run();
