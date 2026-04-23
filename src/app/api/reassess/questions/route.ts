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

    // 2. Generate questions via AI
    const SYSTEM_PROMPT = `You are the EgoArena Re-assessment logic. 
A user is returning for a psychological re-evaluation of their character card.
Current Identity: ${card.class} (${card.alignment})
Stats: ${JSON.stringify(card.stats)}
Fatal Flaw: "${card.fatal_flaw}"
Previous Answers: ${JSON.stringify(card.answers)}

Based on this history, generate 10 BESPOKE, PROVOCATIVE, and DEEPLY PERSONAL follow-up questions.
Do NOT ask generic questions. Ask things that challenge their previous answers or probe their "shadow" side.
For example, if they said they value discipline, ask them about the one time their discipline failed and they loved it.
Make the tone sharp, clinical, but insightful.

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
Return ONLY JSON.`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || "openrouter/auto",
      messages: [{ role: "system", content: SYSTEM_PROMPT }],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No content generated");

    const parsed = JSON.parse(content);
    return NextResponse.json(parsed);

  } catch (error: any) {
    console.error("Error generating reassessment questions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
