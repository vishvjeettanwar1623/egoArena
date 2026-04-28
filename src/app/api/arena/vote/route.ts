import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function calculateElo(ratingA: number, ratingB: number, actualScoreA: number) {
  // standard ELO
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const K = 32;
  const newRatingA = Math.round(ratingA + K * (actualScoreA - expectedA));
  return newRatingA;
}

export async function POST(req: Request) {
  try {
    const { winnerId, loserId, scenarioId, roast, voterCardId } = await req.json();

    if (!winnerId || !loserId) {
      return NextResponse.json({ error: "Missing ids" }, { status: 400 });
    }

    // Fetch both cards
    const { data: cards, error: fError } = await supabase
      .from("cards")
      .select("*")
      .in('id', [winnerId, loserId]);

    if (fError || !cards || cards.length !== 2) {
      return NextResponse.json({ error: "Cards not found" }, { status: 404 });
    }

    const winner = cards.find(c => c.id === winnerId)!;
    const loser = cards.find(c => c.id === loserId)!;

    // Calculate new ELOs
    const newWinnerElo = calculateElo(winner.elo, loser.elo, 1);
    const newLoserElo = calculateElo(loser.elo, winner.elo, 0);

    // Update Winner
    await supabase.from("cards").update({
      elo: newWinnerElo,
      wins: (winner.wins || 0) + 1,
      streak: (winner.streak || 0) + 1
    }).eq("id", winner.id);

    // Update Loser
    await supabase.from("cards").update({
      elo: newLoserElo,
      losses: (loser.losses || 0) + 1,
      streak: 0
    }).eq("id", loser.id);

    // LOG THE BATTLE
    // In our quick-vote system, a vote *is* a battle result.
    await supabase.from("battles").insert({
      card_a: winnerId,
      card_b: loserId,
      winner: winnerId,
      scenario_id: (scenarioId && scenarioId !== 'fallback' && scenarioId !== 'undefined') ? scenarioId : null,
      votes_a: 1,
      votes_b: 0,
      status: 'closed'
    });

    // Update voter's daily limit if they are authenticated via card
    if (voterCardId) {
      const todayDate = new Date().toISOString().split('T')[0];
      const { data: voterData } = await supabase.from('cards').select('battles_today, last_battle_date').eq('id', voterCardId).single();
      
      if (voterData) {
        let battlesToday = voterData.battles_today || 0;
        if (voterData.last_battle_date !== todayDate) {
          battlesToday = 0;
        }
        await supabase.from('cards').update({
          battles_today: battlesToday + 1,
          last_battle_date: todayDate
        }).eq('id', voterCardId);
      }
    }

    return NextResponse.json({ success: true, newWinnerElo, newLoserElo });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
