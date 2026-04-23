import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userCardId = searchParams.get('cardId');
    const lastScenarioId = searchParams.get('lastScenarioId');

    // 1. Fetch scenarios
    const { data: scenarios, error: sError } = await supabase
      .from("scenarios")
      .select("*")
      .eq("active", true);
      
    let scenario;
    const fallbacks = [
      { id: "fallback_1", prompt: "Someone is crying in the bathroom at a party. Who is the one who walks in, hands them a tissue, and leaves without a word?", category: "social" },
      { id: "fallback_2", prompt: "The truth will ruin a perfect life, but a lie will keep the peace forever. Who is the person who burns it all down just to be honest?", category: "moral" },
      { id: "fallback_3", prompt: "In a room full of noise and ego, who is the one who stays silent because they are the only one actually listening?", category: "social" },
      { id: "fallback_4", prompt: "You've lost everything you spent a decade building. Who is the person who wakes up the next morning and starts over without self-pity?", category: "resilience" },
      { id: "fallback_5", prompt: "The crowd is demanding blood for a mistake someone else made. Who is the one who steps into the light to take the blame?", category: "moral" },
      { id: "fallback_6", prompt: "A child asks a question about death that adults usually lie about. Who is the one who tells them the cold, beautiful truth?", category: "social" },
      { id: "fallback_7", prompt: "Everyone is panicking during a crisis. Who is the person whose heartbeat doesn't even speed up because they've already accepted the worst?", category: "crisis" },
      { id: "fallback_8", prompt: "You have the chance to take revenge on someone who ruined you, and you'll never get caught. Who is the one who walks away?", category: "moral" },
      { id: "fallback_9", prompt: "You're in a conversation with someone you despise, but they are making a valid point. Who is the one who admits they are right?", category: "social" },
      { id: "fallback_10", prompt: "Everything is going perfectly. Who is the person who is already looking for the cracks because they know perfection is a trap?", category: "intellect" }
    ];

    if (sError || !scenarios?.length) {
       // Use fallbacks
       const filteredFallbacks = lastScenarioId 
          ? fallbacks.filter(f => f.id !== lastScenarioId)
          : fallbacks;
       scenario = filteredFallbacks[Math.floor(Math.random() * filteredFallbacks.length)];
    } else {
       // Use DB scenarios
       const filteredScenarios = lastScenarioId
          ? scenarios.filter(s => s.id !== lastScenarioId)
          : scenarios;
       
       // If only 1 scenario exists and it was the last one, just use it
       const pool = filteredScenarios.length > 0 ? filteredScenarios : scenarios;
       scenario = pool[Math.floor(Math.random() * pool.length)];
    }
    
    let baseElo = 1200;
    let isPlacement = true;

    if (userCardId) {
       const { data: userCard } = await supabase.from('cards').select('elo, wins, losses').eq('id', userCardId).single();
       if (userCard) {
         baseElo = userCard.elo;
         if (userCard.wins + userCard.losses >= 5) {
            isPlacement = false;
         }
       }
    }

    // 2. Fetch opponent cards based on Elo proximity
    let query = supabase.from("cards").select("*");
    
    if (isPlacement) {
        query = query.order('created_at', { ascending: false });
    } else {
        query = query.gte('elo', baseElo - 200).lte('elo', baseElo + 200);
    }
    
    const { data: cards, error: cError } = await query.limit(50);
    let matchCandidates = cards || [];
    
    if (matchCandidates.length < 2) {
       const { data: fallbackCards } = await supabase.from("cards").select("*").order('created_at', { ascending: false }).limit(50);
       matchCandidates = fallbackCards || [];
    }

    if (matchCandidates.length < 2) {
      return NextResponse.json({ error: "Not enough cards in the system yet." }, { status: 400 });
    }

    // Shuffle and pick 2
    const shuffled = [...matchCandidates].sort(() => 0.5 - Math.random());
    const matchCards = [shuffled[0], shuffled[1]];

    return NextResponse.json({
      scenario,
      cards: matchCards
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
