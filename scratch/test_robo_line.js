
const line = `13-04-2026 13:55:06	GOGOL, MARISA- GPRS	Robo		(1) MD96 - Entrada`;
const eventMatch2 = line.match(/(\d{2}-\d{2}-\d{4}\s\d{2}:\d{2}:\d{2})[\s\t]+.*?(?:GPRS|WIFI|IPR|NAIR)[\s\t]+([^\t\n]+?)(?:[\s\t]{2,}(.*))?/i);

if (eventMatch2) {
    console.log("Event Match:", { date: eventMatch2[1], desc: eventMatch2[2], zone: eventMatch2[3] });
} else {
    console.log("No match");
}
