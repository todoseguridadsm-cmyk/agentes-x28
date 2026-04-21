import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envItem = fs.readFileSync('.env.local', 'utf8');
const url = envItem.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = envItem.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const db = createClient(url, key);

async function check() {
  const { data: events } = await db.from('events').select('event_type, priority, raw_email_text, account_number, created_at').order('created_at', {ascending: false}).limit(3);
  console.log("LAST EVENTS:", events);
  
  const { data: to } = await db.from('technical_orders').select('*').order('created_at', {ascending: false}).limit(3);
  console.log("LAST ORDERS:", to);
}
check();
