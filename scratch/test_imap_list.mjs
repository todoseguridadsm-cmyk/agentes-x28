
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
  let lock = await client.getMailboxLock('INBOX');
  try {
    let count = 0;
    for await (let msg of client.listMessages('INBOX', '1:*', { envelope: true })) {
      count++;
      console.log(`Email ${count}: ${msg.envelope.subject} from ${msg.envelope.from[0].address}`);
    }
    console.log(`Total emails: ${count}`);
  } finally {
    lock.release();
  }
  await client.logout();
}

test().catch(console.error);
