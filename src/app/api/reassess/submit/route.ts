import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    const { cardId, answers } = await req.json();

    if (!cardId || !answers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Fetch the old card
    const { data: oldCard, error: cardError } = await supabase
      .from("cards")
      .select("*")
      .eq("id", cardId)
      .single();

    if (cardError || !oldCard) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // 2. Analyze the evolution via AI
    const SYSTEM_PROMPT = `You are the EgoArena Evolution logic. 
A user has completed a re-assessment. You must analyze how they have changed.
Old Card: ${JSON.stringify(oldCard)}
New Answers: ${JSON.stringify(answers)}

Analyze the shift in their psyche. 
Are they more disciplined now? Have they embraced chaos? Has their class evolved?
(e.g. A "Hustler" might become a "Tycoon" or a "Burnout").

Return a strict JSON object with this schema:
{
  "class": "string", // can be same or new
  "alignment": "string",
  "stats": { "discipline": 0-100, "chaos": 0-100, "empathy": 0-100, "intellect": 0-100, "resilience": 0-100 },
  "fatal_flaw": "string", // updated or refined
  "evolution_note": "A short, sharp sentence explaining why they changed."
}
Return ONLY JSON.`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || "openrouter/auto",
      messages: [{ role: "system", content: SYSTEM_PROMPT }],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No content generated");
    const parsed = JSON.parse(content);

    // 3. Update the card in DB
    const { data: updatedCard, error: updateError } = await supabase
      .from("cards")
      .update({
        class: parsed.class,
        alignment: parsed.alignment,
        stats: parsed.stats,
        fatal_flaw: parsed.fatal_flaw,
        answers: { ...oldCard.answers, ...answers }, // Merge answers
        version: (oldCard.version || 1) + 1,
      })
      .eq("id", cardId)
      .select()
      .single();

    if (updateError) {
      console.error("Update Error:", updateError);
      throw new Error("Failed to update card");
    }

    return NextResponse.json({ card: updatedCard, evolution_note: parsed.evolution_note });

  } catch (error: any) {
    console.error("Error submitting reassessment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
