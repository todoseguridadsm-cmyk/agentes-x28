const REPORTE = `Reporte histórico de eventos

Fecha del Reporte:	06-04-2026

Fecha	Cuenta	Evento	Usuario	Zona
BRN-B617 SARSAR ROBERTO MARIO - WIFI
Miranda S/N (Ex Morán) Chapanay - Mendoza , Mendoza | San Martín | Chapanay
06-04-2026 06:19:26	SARSAR ROBERTO MARIO - WIFI	Robo		(2) MD96 - Galpón grande
Categorizacion
Alarma Falsa - Motivo de disparo no det.
Resolución
Despacho a Policia local`;

async function sendTestEmail() {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer re_6dVdXCNJ_E1mMWcBW5fAWbCCfwpXYcNr3'
    },
    body: JSON.stringify({
      from: 'Sistema <test@alertas.agentes28.com>',
      to: 'x28@alertas.agentes28.com',
      subject: 'Prueba de Recepcion Inbound',
      text: REPORTE
    })
  });
  
  const data = await res.json();
  console.log("Respuesta de API de Resend:", data);
}

sendTestEmail();
