import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BRUTAL_SCENARIOS = [
  { prompt: "The plane is going down and there is only one parachute. Who is strong enough to push you out of the way and take it?", category: "survival", favors_stats: ["chaos", "resilience"] },
  { prompt: "You both found a bag with $100,000 in cash. Who is already planning how to make you disappear so they don't have to share?", category: "moral", favors_stats: ["intellect", "chaos"] },
  { prompt: "You're both being interrogated by the police for a crime you committed together. Who is going to snitch first to get a plea deal?", category: "tactical", favors_stats: ["empathy", "chaos"] },
  { prompt: "The oxygen in the bunker is running out. Only one person can stay awake to manage the filters. Who falls asleep and lets everyone die?", category: "survival", favors_stats: ["resilience", "discipline"] },
  { prompt: "You're at a high-stakes dinner with a billionaire who can fund your dream. Who is going to embarrass themselves by trying too hard to be liked?", category: "social", favors_stats: ["empathy", "discipline"] },
  { prompt: "A viral video of you doing something 'problematic' just leaked. Who do you trust to shamelessly spin the story until the world hates the victim instead?", category: "social", favors_stats: ["intellect", "chaos"] },
  { prompt: "You're lost in the woods and starving. Who starts looking at your leg like it's a drumstick first?", category: "survival", favors_stats: ["chaos", "resilience"] },
  { prompt: "The cult leader demands a sacrifice. Who is already pointing the finger at you before the sentence is finished?", category: "moral", favors_stats: ["chaos", "intellect"] },
  { prompt: "You both have the same terminal illness. There is only one dose of the cure. Who steals it from the medical cabinet at 3 AM?", category: "survival", favors_stats: ["chaos", "intellect"] },
  { prompt: "A massive riot is happening outside. You need to get through the crowd. Who is going to use you as a human shield to make it to the other side?", category: "survival", favors_stats: ["chaos", "resilience"] },
  { prompt: "The project failed. The boss is looking for someone to fire. Who has already BCC'd the boss on every mistake you made in the last six months?", category: "professional", favors_stats: ["intellect", "discipline"] },
  { prompt: "You're both hiding in a closet from a serial killer. Who is going to sneeze and get you both killed because they can't control their nerves?", category: "survival", favors_stats: ["discipline", "resilience"] },
  { prompt: "You found out a secret that could ruin a politician's life. Who sells the info to the highest bidder without telling you?", category: "moral", favors_stats: ["intellect", "chaos"] },
  { prompt: "The zombie apocalypse just started. Who is the first person to hide their bite until it's too late for everyone else in the room?", category: "survival", favors_stats: ["empathy", "chaos"] },
  { prompt: "You're in a life-or-death negotiation. Who is going to lose their temper and get everyone executed because they can't handle being insulted?", category: "tactical", favors_stats: ["discipline", "empathy"] },
  { prompt: "The company is going bankrupt. Who is the first to start stealing office supplies and 'forgetting' to return the company laptop?", category: "professional", favors_stats: ["chaos", "intellect"] },
  { prompt: "You both witness a hit-and-run by a powerful person. Who is already writing the blackmail letter while you're calling 911?", category: "moral", favors_stats: ["intellect", "chaos"] },
  { prompt: "The cult is asking for a 'spiritual leader'. Who is going to thrive in a position of absolute, unchecked power over others?", category: "social", favors_stats: ["chaos", "intellect"] },
  { prompt: "You're stranded on a desert island. Who is the first to suggest 'restructuring' the group so they don't have to do any manual labor?", category: "survival", favors_stats: ["intellect", "discipline"] },
  { prompt: "A massive secret is out. You need someone to lie under oath to save your life. Who is going to crack under the slightest bit of pressure from the judge?", category: "moral", favors_stats: ["resilience", "discipline"] },
  { prompt: "You're both in a high-speed chase. Who is going to panic and drive the car into a wall because they can't handle the adrenaline?", category: "tactical", favors_stats: ["resilience", "discipline"] },
  { prompt: "The internet has turned against you. Who is the first 'friend' to post a 10-part thread explaining why they always knew you were a bad person?", category: "social", favors_stats: ["empathy", "chaos"] },
  { prompt: "You're both trapped in a room that's slowly filling with water. There's one small air pocket. Who pushes you down to take the last breath?", category: "survival", favors_stats: ["resilience", "chaos"] },
  { prompt: "The heist went perfectly, but the cops are closing in. Who is the first to dump the loot and use the other person as bait to escape?", category: "tactical", favors_stats: ["intellect", "chaos"] },
  { prompt: "You're both up for the same promotion. Who is going to start a rumor that you're 'not a culture fit' to sink your chances?", category: "professional", favors_stats: ["intellect", "discipline"] },
  { prompt: "A wildfire is approaching. Who is the first to grab their expensive watch collection and leave the cat behind?", category: "survival", favors_stats: ["chaos", "empathy"] },
  { prompt: "You're both being blackmailed. Who is going to pay off the blackmailer with *your* money instead of their own?", category: "moral", favors_stats: ["intellect", "chaos"] },
  { prompt: "The group is voting on who should go on the suicide mission. Who is the first to start a passionate speech about why *you* are the most qualified?", category: "survival", favors_stats: ["intellect", "empathy"] },
  { prompt: "You're both on a reality show. Who is the first to manufacture a fake mental breakdown for more screen time?", category: "social", favors_stats: ["chaos", "empathy"] },
  { prompt: "The bunker door is jammed from the outside. Who is the first to start hoarding the canned peaches while everyone else is sleeping?", category: "survival", favors_stats: ["discipline", "chaos"] }
];

async function seed() {
  console.log("Wiping old scenarios...");
  await supabase.from('scenarios').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log(`Inserting ${BRUTAL_SCENARIOS.length} high-quality, brutal scenarios...`);
  const { error } = await supabase.from('scenarios').insert(
    BRUTAL_SCENARIOS.map(s => ({ ...s, active: true }))
  );

  if (error) {
    console.error("Error inserting:", error);
  } else {
    console.log("Successfully wiped and re-seeded with EgoArena-tier content!");
  }
}

seed().catch(console.error);
