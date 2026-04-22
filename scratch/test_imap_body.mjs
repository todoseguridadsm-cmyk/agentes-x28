
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
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
  let lock = await client.getMailboxLock('INBOX');
  try {
    const status = await client.status('INBOX', { messages: true });
    for (let i = 1; i <= status.messages; i++) {
      let message = await client.fetchOne(i.toString(), { source: true });
      const parsed = await simpleParser(message.source);
      console.log(`--- Email ${i} ---`);
      console.log(`Subject: ${parsed.subject}`);
      console.log(`From: ${parsed.from?.text || 'N/A'}`);
      console.log(`To: ${parsed.to?.text || 'N/A'}`);
      console.log(`Body Snippet: ${(parsed.text || "").substring(0, 500)}`);
    }
  } finally {
    lock.release();
  }
  await client.logout();
}

test().catch(console.error);
