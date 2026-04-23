import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "", 
});

export async function POST(req: Request) {
  try {
    const { cardId } = await req.json();

    if (!cardId) {
      return NextResponse.json({ error: "Missing Card ID" }, { status: 400 });
    }

    // Fetch the existing card to get stats
    const { data: card, error: fetchError } = await supabase
      .from("cards")
      .select("*")
      .eq("id", cardId)
      .single();

    if (fetchError || !card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // --- MASK GENERATION LOGIC (DUPLICATED FOR BACKFILL) ---
    const stats = card.stats || {};
    const chaosScore = stats.chaos || 50;
    const calmScore = stats.discipline || 50;
    const powerScore = ((stats.intellect || 50) + (stats.resilience || 50)) / 2;

    const traitEntries = Object.entries(stats);
    const dominantStat = traitEntries.reduce((a, b) => (a[1] as number) > (b[1] as number) ? a : b)[0];
    
    const traitMap: Record<string, string> = {
      chaos: "Chaotic",
      discipline: "Disciplined",
      empathy: "Serene",
      resilience: "Aggressive",
      intellect: "Mysterious"
    };
    const dominantTrait = traitMap[dominantStat] || "Mysterious";

    const maskPrompt = `Generate a ceremonial fantasy mask as a profile avatar for ${card.name || 'Anon'}.
Dominant trait: ${dominantTrait}
Chaos score: ${chaosScore} out of 100
Calm score: ${calmScore} out of 100
Power score: ${powerScore} out of 100

Design rules:
${chaosScore >= 70 ? "- High chaos: jagged cracks, asymmetry, molten dripping edges, fractured surface, violent sharp angles" : ""}
${calmScore >= 70 ? "- High calm: smooth porcelain or jade surface, floral or wave motifs, soft symmetrical geometry, clean finish" : ""}
${powerScore >= 70 ? "- High power: heavy ornate crown elements, gold embossing, dark obsidian or black iron base" : ""}
- Mixed scores: blend the above proportionally

Eye glow color: ${
      dominantTrait === "Chaotic" ? "blood red" :
      dominantTrait === "Serene" ? "soft white" :
      dominantTrait === "Aggressive" ? "deep red" :
      dominantTrait === "Disciplined" ? "gold" :
      dominantTrait === "Mysterious" ? "violet" : "warm amber"
    }

The mask floats on a pure black void background. Frontal symmetrical view. Ultra-detailed 3D render. Square format 1:1. No human face. Only the mask. Photorealistic studio lighting from above.`;

    let avatarUrl = null;
    try {
      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: maskPrompt,
        n: 1,
        size: "1024x1024",
      });
      avatarUrl = imageResponse.data[0].url;
    } catch (imageError: any) {
      console.error("Image generation failed:", imageError);
      return NextResponse.json({ error: "AI Image API failed: " + (imageError.message || "Unknown error") }, { status: 500 });
    }

    // Update the card with the new avatar URL
    const { error: updateError } = await supabase
      .from("cards")
      .update({ avatar_url: avatarUrl })
      .eq("id", cardId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update database" }, { status: 500 });
    }

    return NextResponse.json({ avatar_url: avatarUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
