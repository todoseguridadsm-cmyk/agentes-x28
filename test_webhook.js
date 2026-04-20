const mails = [
`En cuenta 729C - MONDELLO SRL - GPRS se ha generado una Señal No Recibida a las 20:30:00 del dia 2026-04-19. Por consultas comuniquese al 0810-5555-666. Muchas Gracias de cuidar@x-28.com`,

`Reporte histórico de eventos
Fecha del Reporte:18-04-2026
FechaCuentaEventoUsuarioZona
BRN-FE57 OCHOA, GABRIELA BEATRIZ - GPRS
18-04-2026 04:30:11OCHOA, GABRIELA BEATRIZ - GPRSRobo(1) MD96RL - Planta BajaCategorizacion`,

`HOJA DE SERVICIO TECNICO
Orden N: 274492
DATOS DEL CLIENTECuenta N: BRN 0D02 Nombre: PERSIA GIMENA - WIFI
Observaciones: Faltan el formulario Alta de Opcionales para poder programar el OPT102. Los datos del domicilio son muy pocos, necesitamos algun dato mas para poder mandar a la policia en caso de ser necesario.`
];

async function run() {
  for (const email of mails) {
    const res = await fetch('http://localhost:3000/api/webhook/email', {
      method: 'POST',
      body: email
    });
    console.log(await res.json());
  }
}

run();
