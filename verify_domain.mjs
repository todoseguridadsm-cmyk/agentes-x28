import * as fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const match = envContent.match(/RESEND_API_KEY=\s*(.+)/);
if (!match) {
  console.log("No RESEND_API_KEY found");
  process.exit(1);
}
const RESEND_API_KEY = match[1].trim();
const DOMAIN_ID = "e8af028b-93df-4db8-9e99-4d46ad28c9f5";

async function verifyDomain() {
  console.log("Triggering verification for domain", DOMAIN_ID);
  try {
      const res = await fetch(`https://api.resend.com/domains/${DOMAIN_ID}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`
        }
      });
      
      if (res.ok) {
         const data = await res.json();
         console.log('Verify response:', JSON.stringify(data, null, 2));
      } else {
         const err = await res.text();
         console.log('Error verifying:', res.status, err);
      }
  } catch (e) {
      console.error(e);
  }
}

verifyDomain();
