const net = require('net');

const host = 'inbound.resend.com';
const port = 25;
const to = 'reportes@alertas.agentes28.com';
const from = 'debug@todoseguridadsm.com';

const socket = new net.Socket();
let step = 0;

socket.connect(port, host, () => {
    console.log(`[SMTP] Connected to ${host}:${port}`);
});

socket.on('data', (data) => {
    const msg = data.toString();
    console.log(`[SERVER] ${msg.trim()}`);
    
    if (step === 0 && msg.startsWith('220')) {
        console.log('[CLIENT] HELO localhost');
        socket.write('HELO localhost\r\n');
        step++;
    } else if (step === 1 && msg.startsWith('250')) {
        console.log(`[CLIENT] MAIL FROM:<${from}>`);
        socket.write(`MAIL FROM:<${from}>\r\n`);
        step++;
    } else if (step === 2 && msg.startsWith('250')) {
        console.log(`[CLIENT] RCPT TO:<${to}>`);
        socket.write(`RCPT TO:<${to}>\r\n`);
        step++;
    } else if (step === 3) {
        if (msg.startsWith('250')) {
            console.log(`[CLIENT] DATA`);
            socket.write(`DATA\r\n`);
            step++;
        } else {
            console.log(`[ERROR] RCPT TO REJECTED! Resend says NO.`);
            socket.destroy();
        }
    } else if (step === 4 && msg.startsWith('354')) {
        console.log(`[CLIENT] Sending message body...`);
        socket.write(`Subject: Debug Test\r\n\r\nHOJA DE SERVICIO TECNICO\r\nCuenta N: 76F0  Nombre: Test Name - GPRS\r\n\r\n.\r\n`);
        step++;
    } else if (step === 5 && msg.startsWith('250')) {
        console.log(`[CLIENT] QUIT`);
        socket.write(`QUIT\r\n`);
        step++;
    } else if (step === 6) {
        socket.destroy();
    }
});

socket.on('close', () => {
    console.log('[SMTP] Connection closed.');
});

socket.on('error', (err) => {
    console.error('[SMTP ERROR]', err.message);
});
