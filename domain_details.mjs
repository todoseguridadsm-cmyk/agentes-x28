import * as fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const match = envContent.match(/RESEND_API_KEY=\s*(.+)/);
const RESEND_API_KEY = match[1].trim();
const DOMAIN_ID = "e8af028b-93df-4db8-9e99-4d46ad28c9f5";

async function verifyDomainDetails() {
  try {
      const res = await fetch(`https://api.resend.com/domains/${DOMAIN_ID}`, {
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`
        }
      });
      const data = await res.json();
      console.log(JSON.stringify(data, null, 2));
  } catch (e) {
      console.error(e);
  }
}
verifyDomainDetails();
