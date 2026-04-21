import * as fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const match = envContent.match(/RESEND_API_KEY=\s*(.+)/);
if (!match) {
  console.log("No RESEND_API_KEY found");
  process.exit(1);
}
const RESEND_API_KEY = match[1].trim();

async function checkWebhooks() {
  const res = await fetch('https://api.resend.com/webhooks', {
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`
    }
  });
  const data = await res.json();
  console.log('Webhooks list:', JSON.stringify(data, null, 2));
}

checkWebhooks();
