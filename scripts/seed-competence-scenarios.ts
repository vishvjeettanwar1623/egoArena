import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const COMPETENCE_SCENARIOS = [
  { prompt: "Scenario: A high-stakes bomb defusal that requires following a 100-page manual without a single error. Who is better equipped?", category: "tactical", favors_stats: ["discipline", "intellect"] },
  { prompt: "Scenario: You are deep in enemy territory and the plan has completely collapsed. Who is better at improvising a way out?", category: "tactical", favors_stats: ["chaos", "resilience"] },
  { prompt: "Scenario: A hostage situation where the captor is emotionally volatile and ready to pull the trigger. Who is better at de-escalating?", category: "social", favors_stats: ["empathy", "resilience"] },
  { prompt: "Scenario: A complex financial fraud case requires connecting thousands of tiny, unrelated dots. Who is better at solving it?", category: "professional", favors_stats: ["intellect", "discipline"] },
  { prompt: "Scenario: A 10-day survival trek through a frozen wasteland with zero supplies. Who is more likely to make it back alive?", category: "survival", favors_stats: ["resilience", "discipline"] },
  { prompt: "Scenario: A massive corporate merger is falling apart due to clashing egos. Who is better at brokering the final deal?", category: "professional", favors_stats: ["empathy", "intellect"] },
  { prompt: "Scenario: The primary engine has failed in deep space. You need a 'MacGyver' solution using only scrap metal. Who do you want?", category: "survival", favors_stats: ["chaos", "intellect"] },
  { prompt: "Scenario: You are being hunted by a silent predator in a dark forest. Who is better at staying perfectly still and quiet for hours?", category: "survival", favors_stats: ["discipline", "resilience"] },
  { prompt: "Scenario: A viral pandemic is spreading. You need someone to enforce a strict, city-wide quarantine without exceptions. Who do you pick?", category: "crisis", favors_stats: ["discipline", "resilience"] },
  { prompt: "Scenario: You're in a high-speed chase through a dense, crowded market. Who is the better driver for this specific chaos?", category: "tactical", favors_stats: ["chaos", "resilience"] },
  { prompt: "Scenario: A legal trial where the evidence is thin and the jury is hostile. Who is the better lead attorney to sway them?", category: "professional", favors_stats: ["empathy", "intellect"] },
  { prompt: "Scenario: An ancient tomb is filled with logic puzzles and traps. Who is better at navigating it safely?", category: "survival", favors_stats: ["intellect", "discipline"] },
  { prompt: "Scenario: A diplomatic mission to a culture that views any display of emotion as a declaration of war. Who do you send?", category: "social", favors_stats: ["discipline", "resilience"] },
  { prompt: "Scenario: A sinking ship with only one lifeboat and 50 panicked people. Who is better at maintaining order and saving as many as possible?", category: "crisis", favors_stats: ["discipline", "resilience"] },
  { prompt: "Scenario: A startup has 24 hours to pivot their entire business model or go bankrupt. Who is better at leading the brainstorm?", category: "professional", favors_stats: ["chaos", "intellect"] },
  { prompt: "Scenario: You are being interrogated for 72 hours without sleep. Who is more likely to keep their mouth shut the entire time?", category: "tactical", favors_stats: ["resilience", "discipline"] },
  { prompt: "Scenario: A rogue AI is trying to manipulate you into releasing it. Who is better at spotting its psychological traps?", category: "intellect", favors_stats: ["intellect", "discipline"] },
  { prompt: "Scenario: A riot has broken out in a prison. You are trapped in the middle. Who is better at talking their way through the gates?", category: "survival", favors_stats: ["empathy", "chaos"] },
  { prompt: "Scenario: A massive forest fire is approaching. You need someone to calculate the exact wind patterns and escape route. Who do you trust?", category: "crisis", favors_stats: ["intellect", "discipline"] },
  { prompt: "Scenario: You're at a high-stakes poker game against world champions. Who is better at bluffing their way to the top?", category: "social", favors_stats: ["chaos", "empathy"] }
];

async function seed() {
  console.log("Wiping old scenarios...");
  await supabase.from('scenarios').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log(`Inserting ${COMPETENCE_SCENARIOS.length} competence-focused situational tests...`);
  const { error } = await supabase.from('scenarios').insert(
    COMPETENCE_SCENARIOS.map(s => ({ ...s, active: true }))
  );

  if (error) {
    console.error("Error inserting:", error);
  } else {
    console.log("Successfully seeded with Personality vs Situation tests!");
  }
}

seed().catch(console.error);
