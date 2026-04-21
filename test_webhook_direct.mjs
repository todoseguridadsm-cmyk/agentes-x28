async function testWebhook() {
  const url = 'https://plataforma-agencias-x28.vercel.app/api/webhook/email?token=webhook_xtoken_wo01h7ho';
  const body = {
    data: {
      html: '',
      text: 'HOJA DE SERVICIO TECNICO\nCuenta N: 76F0  Nombre: Test Name - GPRS\n'
    }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const text = await res.text();
    console.log(res.status, text);
  } catch (e) {
    console.error(e);
  }
}
testWebhook();
