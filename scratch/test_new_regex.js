
const block = `BRN-53F0 PROVIDUS S.A. - GPRS
Coronel Moldes 546 Mendoza - Capital , Mendoza | Capital | Mendoza
13-04-2026 23:40:00	PROVIDUS S.A. - GPRS	Señal No Recibida`;

const headerMatch = block.match(/BRN-([A-Z0-9]+)\s+([^-]+?)\s*-\s*(GPRS|WIFI|IPR|NAIR)/i);
console.log("Header Match:", headerMatch ? { account: headerMatch[1], name: headerMatch[2] } : "No match");

const lines = block.split('\n');
for (const line of lines) {
    const eventMatch = line.match(/(\d{2}-\d{2}-\d{4}\s\d{2}:\d{2}:\d{2})\s+.*?\s+([^\t\n]+)(?:\t+(.*))?/);
    if (eventMatch) {
        console.log("Event Match:", { date: eventMatch[1], desc: eventMatch[2], zone: eventMatch[3] });
    }
}
