import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "", 
});

const SYSTEM_PROMPT = `You are a creative game designer for EgoArena. Generate 10 unique hypothetical scenarios for a voting battle. 
They should test personality traits like survival, social grace, moral dilemmas, creativity, or leadership.
Return a strict JSON object with this schema:
{
  "scenarios": [
    {
      "prompt": "Scenario description...",
      "category": "survival | social | moral | professional",
      "favors_stats": ["discipline", "chaos"]
    }
  ]
}
No markdown wrappers around JSON. Only JSON.`;

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return new Response('Unauthorized', { status: 401 });
    }

    const response = await openai.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || "openrouter/auto",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: "Generate 10 new scenarios." }
      ],
      response_format: { type: "json_object" },
      temperature: 0.9,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No content generated");

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      const match = content.match(/```json([\s\S]*?)```/);
      if (match) parsed = JSON.parse(match[1]);
      else throw new Error("Could not parse JSON");
    }

    if (!parsed.scenarios || !Array.isArray(parsed.scenarios)) {
        throw new Error("Invalid schema");
    }

    // Insert into DB
    const { error } = await supabase.from('scenarios').insert(parsed.scenarios);
    
    if (error) {
       console.error("Supabase Error:", error);
       return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: parsed.scenarios.length });
  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
