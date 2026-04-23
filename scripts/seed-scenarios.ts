import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "", 
});

const SYSTEM_PROMPT = `You are a creative game designer for EgoArena. Generate 50 unique situational scenarios for a "Who do you trust more?" battle.
The goal is to put the user in a high-pressure situation where they must choose between two personality types based on their stats (Discipline, Chaos, Empathy, Intellect, Resilience).

Examples:
- "A surgical procedure is going wrong and requires absolute focus and adherence to protocol." (Favors Discipline)
- "A negotiation with a paranoid warlord is turning violent; someone needs to diffuse the tension." (Favors Empathy)
- "The primary server is under a complex brute-force attack that requires unconventional, creative counter-measures." (Favors Intellect/Chaos)
- "You are stranded in the desert with 1 liter of water and 50 miles to go. Who is leading the march?" (Favors Resilience)

Scenarios should be:
1. Grounded in a specific, high-stakes moment.
2. Formatted as "Situation description. Who do you trust to [action]?"
3. Concise (1-2 sentences).

Return a strict JSON object with this schema:
{
  "scenarios": [
    {
      "prompt": "Situation description. Who do you trust to [action]?",
      "category": "survival | social | tactical | crisis",
      "favors_stats": ["discipline", "chaos", "empathy", "intellect", "resilience"]
    }
  ]
}
Return ONLY the JSON.`;

async function seed() {
  console.log("Generating 50 scenarios via AI...");
  
  const response = await openai.chat.completions.create({
    model: process.env.OPENROUTER_MODEL || "openrouter/auto",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: "Generate 50 diverse, high-stakes scenarios." }
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("No content");

  const parsed = JSON.parse(content);
  console.log(`Generated ${parsed.scenarios.length} scenarios. Inserting into Supabase...`);

  const { error } = await supabase.from('scenarios').insert(
    parsed.scenarios.map((s: any) => ({ ...s, active: true }))
  );

  if (error) {
    console.error("Error inserting:", error);
  } else {
    console.log("Successfully seeded database with 50 new scenarios!");
  }
}

seed().catch(console.error);
