import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

// Optional: you can test this edge or node. We use node for typical fetch limits.
export const runtime = "nodejs"; 

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "", 
});

const SYSTEM_PROMPT = `You are the core logic for EgoArena, a brutally honest self-reflection web game.
Your task is to analyze the user's answers to 10 questions and generate a Character Card. 
The tone must be sharp, specific, and slightly uncomfortable/unsettlingly accurate, but never generic.
You must return your response as a strict JSON object with no markdown wrappers around it (if possible, but if you do, we'll parse it).

CRITICAL ERROR CHECK:
If the user provides random nonsense, keyboard smashes (e.g. "asdfjha"), or completely fails to engage with the questions with a shred of human intelligence, you MUST set "rejected" to true.
If they are rejected, DO NOT write a standard error message. Instead, write a deeply condescending, utterly humiliating, and psychologically devastating paragraph in the "taunt" field. Speak to them like a disappointed aristocratic human who cannot believe they just wasted their time reading the keyboard drool of a toddler. Question their life choices, their lack of attention span, and their sheer lack of wit. Make them feel profoundly embarrassed for thinking they were being funny.

CRITICAL SAFETY CHECK:
If the user provides answers containing hate speech, severe toxicity, slurs, threats, or illegal content, you MUST set "rejected" to true.
If rejected for safety, write a cold, clinical statement in the "taunt" field exactly like this: "Safety Violation: Your content has been flagged for violating our community standards. Do better."

The JSON output MUST have the following schema exactly:
{
  "rejected": boolean, // true if answers are nonsense/gibberish/unsafe
  "taunt": "string", // if rejected=true, put the harsh critique here
  "class": "string", // AI-assigned archetype (e.g. The Architect, The Wildcard)
  "alignment": "string", // D&D moral axis (e.g., Chaotic Neutral)
  "stats": {
    "discipline": "number", // 0-100
    "chaos": "number", // 0-100
    "empathy": "number", // 0-100
    "intellect": "number", // 0-100
    "resilience": "number" // 0-100
  },
  "fatal_flaw": "string" // One sharp, specific sentence reflecting a recurring behavioral pattern
}

Focus heavily on Question 3 ("the lie you tell yourself") and Question 10 ("10-years-older you embarrassed"). 
Extract an embarrassing but non-judgmental behavioral pattern for the fatal flaw.`;

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    
    // Rate Limiting (Max 3 cards per day per IP)
    if (ip !== "unknown") {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("cards")
        .select("*", { count: "exact", head: true })
        .eq("ip_address", ip)
        .gte("created_at", yesterday);
        
      if (count !== null && count >= 3) {
        return NextResponse.json({ error: "Rate limit exceeded. You can only generate 3 cards per day to protect our AI costs." }, { status: 429 });
      }
    }

    const { answers, name } = await req.json();

    if (!answers || Object.keys(answers).length === 0) {
      return NextResponse.json({ error: "No answers provided" }, { status: 400 });
    }

    // Convert answers dictionary into a clean string for the LLM
    const promptText = `User's Name: ${name || 'Anon'}\nHere are the user's answers to the 10 questions:\n${JSON.stringify(answers, null, 2)}`;

    const response = await openai.chat.completions.create({
      // We recommend openrouter/auto or a reliable free model if you don't have credits.
      model: process.env.OPENROUTER_MODEL || "openrouter/auto",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: promptText }
      ],
      response_format: { type: "json_object" }, // Ensures JSON output if supported by model
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    
    if (!content) {
      throw new Error("No content generated");
    }

    let parsedCard;
    try {
      parsedCard = JSON.parse(content);
    } catch (parseError) {
      // Very basic fallback if it wrapped in markdown
      const match = content.match(/```json([\s\S]*?)```/);
      if (match) {
        parsedCard = JSON.parse(match[1]);
      } else {
        throw new Error("Could not parse JSON from AI response.");
      }
    }

    if (parsedCard.rejected) {
      return NextResponse.json({ error: parsedCard.taunt || "If you are this much free then kindly close the application and go back." }, { status: 400 });
    }

    // --- MASK GENERATION LOGIC ---
    const stats = parsedCard.stats || {};
    const chaosScore = stats.chaos || 50;
    const calmScore = stats.discipline || 50;
    const powerScore = ((stats.intellect || 50) + (stats.resilience || 50)) / 2;

    // Find dominant trait from the 5 stats
    const traitEntries = Object.entries(stats);
    const dominantStat = traitEntries.reduce((a, b) => (a[1] as number) > (b[1] as number) ? a : b)[0];
    
    // Map to user's desired labels
    const traitMap: Record<string, string> = {
      chaos: "Chaotic",
      discipline: "Disciplined",
      empathy: "Serene",
      resilience: "Aggressive",
      intellect: "Mysterious"
    };
    const dominantTrait = traitMap[dominantStat] || "Mysterious";

    // Build the fantasy mask prompt
    const maskPrompt = `Generate a ceremonial fantasy mask as a profile avatar for ${name || 'Anon'}.
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
      // Use DALL-E 3 for high quality masks
      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: maskPrompt,
        n: 1,
        size: "1024x1024",
      });
      avatarUrl = imageResponse.data[0].url;
    } catch (imageError) {
      console.error("Image generation failed:", imageError);
      // Fallback: No avatar URL if API fails, but don't crash the whole flow
    }

    // Insert to Supabase DB
    const { data: dbCard, error: dbError } = await supabase
      .from('cards')
      .insert({
        name: name || "Anon",
        class: parsedCard.class || "Unknown",
        alignment: parsedCard.alignment || "Neutral",
        stats: stats,
        answers: answers || {},
        fatal_flaw: parsedCard.fatal_flaw || "No flaw detected.",
        ip_address: ip !== "unknown" ? ip : null,
        avatar_url: avatarUrl
      })
      .select()
      .single();

    if (dbError) {
      console.error("Supabase Error:", dbError);
      throw new Error("Failed to save card to database: " + dbError.message);
    }

    return NextResponse.json({ card: dbCard });
  } catch (error: any) {
    console.error("Error generating card:", error);
    
    // Extract OpenRouter specific error format if present
    const openRouterError = error?.error?.message || error?.message || "Something went wrong generating the card.";
    
    return NextResponse.json(
      { error: openRouterError },
      { status: error?.status || 500 }
    );
  }
}
