import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data, error } = await supabase.from('scenarios').select('*').limit(10).order('created_at', { ascending: false });
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}

check();
