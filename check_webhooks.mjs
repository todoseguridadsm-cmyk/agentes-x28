import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const RESEND_API_KEY = process.env.RESEND_API_KEY;

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
