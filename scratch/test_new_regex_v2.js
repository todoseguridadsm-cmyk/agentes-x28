
const block = `BRN-53F0 PROVIDUS S.A. - GPRS
Coronel Moldes 546 Mendoza - Capital , Mendoza | Capital | Mendoza
13-04-2026 23:40:00	PROVIDUS S.A. - GPRS	Señal No Recibida`;

const lines = block.split('\n');
for (const line of lines) {
    // Usando \s+ para mayor flexibilidad si no hay tabs literales
    const eventMatch = line.match(/(\d{2}-\d{2}-\d{4}\s\d{2}:\d{2}:\d{2})\s+.*?\s{2,}([^\t\n]+)(?:\s{2,}(.*))?/);
    // O mejor, si sabemos que el nombre del cliente se repite:
    const eventMatch2 = line.match(/(\d{2}-\d{2}-\d{4}\s\d{2}:\d{2}:\d{2})[\s\t]+.*?(?:GPRS|WIFI|IPR|NAIR)[\s\t]+([^\t\n]+)(?:[\s\t]+(.*))?/i);

    if (eventMatch2) {
        console.log("Event Match 2:", { date: eventMatch2[1], desc: eventMatch2[2], zone: eventMatch2[3] });
    }
}
