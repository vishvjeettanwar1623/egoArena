import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cardId = searchParams.get("cardId");

    if (!cardId) {
      return NextResponse.json({ error: "Card ID is required" }, { status: 400 });
    }

    // 1. Fetch the existing card
    const { data: card, error: cardError } = await supabase
      .from("cards")
      .select("*")
      .eq("id", cardId)
      .single();

    if (cardError || !card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Check 1-week cooldown in DB
    if (card.last_evolved_at) {
      const lastEvolved = new Date(card.last_evolved_at);
      const now = new Date();
      const diffTime = now.getTime() - lastEvolved.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      if (diffDays < 7) {
        return NextResponse.json({ 
          cooldown: true, 
          daysLeft: Math.ceil(7 - diffDays) 
        });
      }
    }

    if (cardError || !card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // 2. Generate questions via AI
    const SYSTEM_PROMPT = `You are the EgoArena Re-assessment logic. 
A user is returning for a psychological re-evaluation of their character card.
Current Identity: ${card.class} (${card.alignment})
Stats: ${JSON.stringify(card.stats)}
Fatal Flaw: "${card.fatal_flaw}"
Previous Answers: ${JSON.stringify(card.answers)}

Based on this history, generate 10 deeply personal follow-up questions.
IMPORTANT: Use extremely simple, everyday language. Do not use complex vocabulary, philosophical jargon, or "typical AI" speech. Talk to them like a blunt, honest friend.
Do not ask generic questions. Probe directly into their specific past answers to challenge them.
For example, if they said they value discipline, ask them about a time they lost control and secretly enjoyed it.

Return a strict JSON object with this schema:
{
  "questions": [
    {
      "id": "rq1",
      "prompt": "Question text...",
      "type": "text | mcq",
      "options": ["if mcq, 4 options", ...] // only for mcq
    }
  ]
}
Return ONLY valid JSON. Ensure all double quotes inside string values are properly escaped (e.g., \\"word\\").`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || "openrouter/auto",
      messages: [{ role: "system", content: SYSTEM_PROMPT }],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No content generated");

    let parsed;
    try {
      // Strip markdown code blocks if the model mistakenly included them
      const cleanedContent = content.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("JSON Parsing failed. Raw AI Output:", content);
      throw new Error("AI generated invalid JSON. Check server logs for the raw output.");
    }
    
    return NextResponse.json(parsed);

  } catch (error: any) {
    console.error("Error generating reassessment questions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
