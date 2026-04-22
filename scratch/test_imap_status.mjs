
import { ImapFlow } from 'imapflow';
import * as fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2].trim();
});

const client = new ImapFlow({
  host: env.IMAP_HOST,
  port: parseInt(env.IMAP_PORT),
  secure: true,
  auth: {
    user: env.IMAP_USER,
    pass: env.IMAP_PASS
  },
  logger: false
});

async function test() {
  await client.connect();
  let status = await client.status('INBOX', { messages: true, unsee: true });
  console.log("Inbox status:", JSON.stringify(status, null, 2));
  await client.logout();
}

test().catch(console.error);
