import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function update() {
  console.log("Adding columns to cards table...");
  
  // Using rpc or multiple sql-like calls if possible, but since I can't run raw SQL via supabase-js easily without a function, 
  // I will check if they exist first or just try to add them.
  
  // Actually, the best way is to use a direct SQL execution if possible, but I don't have that.
  // I will assume the user will run the schema.sql or I can try to use a simple insert/update to see if it fails.
  
  // Wait, I can use the Supabase REST API to run SQL if the user has it enabled, but usually they don't.
  // I'll just tell the user I've updated the schema.sql and they should apply it, 
  // OR I can try to use a scratch script with pg if I had the connection string.
  
  // I'll try to just update a record with the new column to see if it works.
  const { error } = await supabase.from('cards').select('answers, version').limit(1);
  if (error && error.message.includes('column "answers" does not exist')) {
    console.log("Columns missing. Please run the following SQL in your Supabase SQL Editor:");
    console.log("ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '{}';");
    console.log("ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;");
  } else {
    console.log("Columns already exist or something else happened.");
  }
}

update();
