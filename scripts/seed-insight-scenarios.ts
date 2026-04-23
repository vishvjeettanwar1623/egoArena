import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const INSIGHT_SCENARIOS = [
  { prompt: "Someone is crying in the bathroom at a party. Who is the one who walks in, hands them a tissue, and leaves without a word because they know words are useless right now?", category: "social", favors_stats: ["empathy", "discipline"] },
  { prompt: "A friend has just achieved the dream you've been working on for years. Who can truly smile and celebrate with them without a single flicker of resentment?", category: "social", favors_stats: ["empathy", "resilience"] },
  { prompt: "The truth will ruin a perfect life, but a lie will keep the peace forever. Who is the person who burns it all down just to be honest?", category: "moral", favors_stats: ["chaos", "discipline"] },
  { prompt: "In a room full of noise and ego, who is the one who stays silent because they are the only one actually listening?", category: "social", favors_stats: ["intellect", "discipline"] },
  { prompt: "You've lost everything you spent a decade building. Who is the person who wakes up the next morning and starts over without a second of self-pity?", category: "survival", favors_stats: ["resilience", "discipline"] },
  { prompt: "An old secret has resurfaced that could destroy your reputation. Who is the one who faces it head-on instead of trying to bury it again?", category: "moral", favors_stats: ["resilience", "chaos"] },
  { prompt: "The crowd is demanding blood for a mistake someone else made. Who is the one who steps into the light to take the blame?", category: "moral", favors_stats: ["resilience", "empathy"] },
  { prompt: "A child asks a question about death that adults usually lie about. Who is the one who tells them the cold, beautiful truth?", category: "social", favors_stats: ["chaos", "intellect"] },
  { prompt: "You've been given a position of power you didn't earn. Who is the person who steps down immediately because their ego can't handle the fraud?", category: "professional", favors_stats: ["discipline", "intellect"] },
  { prompt: "Everyone is panicking during a crisis. Who is the person whose heartbeat doesn't even speed up because they've already accepted the worst?", category: "crisis", favors_stats: ["resilience", "discipline"] },
  { prompt: "You're in a conversation with someone you despise, but they are making a valid point. Who is the one who admits they are right?", category: "social", favors_stats: ["intellect", "discipline"] },
  { prompt: "A project you loved is being cancelled. Who is the one who archives the files, thanks the team, and moves on without complaining?", category: "professional", favors_stats: ["discipline", "resilience"] },
  { prompt: "You have the chance to take revenge on someone who ruined you, and you'll never get caught. Who is the one who walks away?", category: "moral", favors_stats: ["discipline", "empathy"] },
  { prompt: "Someone is being mocked in a group chat. Who is the person who stays silent instead of joining in for the 'bonding'?", category: "social", favors_stats: ["discipline", "empathy"] },
  { prompt: "The most important person in your life just let you down. Who is the one who forgives them without making them feel guilty for it?", category: "social", favors_stats: ["empathy", "resilience"] },
  { prompt: "You are the only person who knows the 'genius' plan is actually going to fail. Who is the one who speaks up even if it makes them the enemy?", category: "professional", favors_stats: ["intellect", "chaos"] },
  { prompt: "You're at the top of your field and a newcomer is doing better than you ever did. Who is the one who reaches out to mentor them?", category: "professional", favors_stats: ["empathy", "intellect"] },
  { prompt: "A situation requires a 'white lie' to make everyone feel better. Who is the one who tells the uncomfortable truth instead?", category: "social", favors_stats: ["chaos", "discipline"] },
  { prompt: "You've been given a massive amount of credit for something you only partially did. Who is the one who publicly corrects the record?", category: "professional", favors_stats: ["discipline", "intellect"] },
  { prompt: "Everything is going perfectly. Who is the person who is already looking for the cracks because they know perfection is a trap?", category: "intellect", favors_stats: ["intellect", "resilience"] }
];

async function seed() {
  console.log("Wiping old scenarios...");
  await supabase.from('scenarios').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log(`Inserting ${INSIGHT_SCENARIOS.length} deep-insight psychological tests...`);
  const { error } = await supabase.from('scenarios').insert(
    INSIGHT_SCENARIOS.map(s => ({ ...s, active: true }))
  );

  if (error) {
    console.error("Error inserting:", error);
  } else {
    console.log("Successfully seeded with Deep Insight scenarios!");
  }
}

seed().catch(console.error);
