import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Threads from "@/components/Threads";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  // Fetch real counts from the database
  const { count: cardCount } = await supabase
    .from("cards")
    .select("*", { count: "exact", head: true });

  const { count: battleCount } = await supabase
    .from("battles")
    .select("*", { count: "exact", head: true });

  return (
    <main className="relative min-h-screen">
      {/* HERO — full viewport centered */}
      <div className="relative flex flex-col items-center justify-center min-h-screen text-center px-6 pt-20 pb-16 overflow-hidden">
        
        {/* Background Animation */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
          <Threads
            amplitude={1.2}
            distance={0.1}
            enableMouseInteraction
          />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-accent uppercase mb-8">
            <span className="block w-8 h-[1px] bg-accent"></span>
            Live Beta
            <span className="block w-8 h-[1px] bg-accent"></span>
          </div>

          <h1 className="text-[clamp(3.5rem,10vw,8rem)] font-extrabold leading-[0.9] tracking-[-0.04em] mb-8 font-sans">
            Ego<span className="text-accent">Arena</span>
          </h1>

          <p className="text-lg md:text-xl text-muted max-w-xl font-normal mb-12 leading-relaxed">
            Your personality is a character. Your character has a record. And the
            internet decides if you&apos;d survive.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-20">
            <Link
              href="/create"
              className="group inline-flex items-center justify-center gap-2 px-10 py-5 bg-accent text-bg font-sans font-bold uppercase tracking-widest text-sm rounded-xl hover:-translate-y-1 transition-all shadow-[0_0_40px_rgba(232,201,122,0.25)] hover:shadow-[0_0_60px_rgba(232,201,122,0.4)]"
            >
              Create Your Card
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex items-center justify-center gap-2 px-10 py-5 border border-white/10 text-white/70 font-sans font-semibold uppercase tracking-widest text-sm rounded-xl hover:bg-white/5 hover:text-white transition-all"
            >
              Leaderboard
            </Link>
          </div>

          <div className="flex items-center gap-12 text-center">
            <div>
              <div className="text-3xl font-bold text-white font-sans mb-1">
                {(cardCount || 0).toLocaleString()}
              </div>
              <div className="font-mono text-[10px] text-white/40 uppercase tracking-widest">Cards Generated</div>
            </div>
            <div className="w-px h-10 bg-white/10"></div>
            <div>
              <div className="text-3xl font-bold text-white font-sans mb-1">
                {(battleCount || 0).toLocaleString()}
              </div>
              <div className="font-mono text-[10px] text-white/40 uppercase tracking-widest">Battles Fought</div>
            </div>
            <div className="w-px h-10 bg-white/10"></div>
            <div>
              <div className="text-3xl font-bold text-green font-sans mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green inline-block animate-pulse"></span>
                Live
              </div>
              <div className="font-mono text-[10px] text-white/40 uppercase tracking-widest">Arena Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* WHAT IS EGOARENA */}
      <div className="max-w-3xl mx-auto px-6 pb-32">
        <div className="border-t border-white/5 pt-20 mb-20">
          <div className="font-mono text-[10px] text-accent tracking-[0.2em] uppercase mb-4">01 — Concept</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">What is EgoArena?</h2>
          <p className="text-muted leading-relaxed text-lg mb-4">
            EgoArena turns self-reflection into a competitive game. You answer 10 brutally honest questions about yourself — your
            values, habits, flaws, and instincts.
          </p>
          <p className="text-muted leading-relaxed text-lg mb-6">
            An AI processes your answers and generates a <strong className="text-white">Character Card</strong>: a styled
            AI grades your honesty and creates a detailed profile mapping 5 core psychological stats (discipline, chaos,
            empathy, intellect, resilience), and a named fatal flaw.
          </p>
          <div className="bg-accent/5 border-l-4 border-accent rounded-r-xl p-6 my-8">
            <p className="font-mono text-sm text-white/70 italic leading-relaxed">
              The core loop: answer honestly → get a card that feels unsettlingly accurate → watch strangers judge you → get addicted to your record.
            </p>
          </div>
        </div>

        <div className="border-t border-white/5 pt-20 mb-20">
          <div className="font-mono text-[10px] text-accent tracking-[0.2em] uppercase mb-4">02 — The Arena</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">How does the Arena work?</h2>
          <p className="text-muted leading-relaxed text-lg mb-4">
            Every card is put into the Arena. Scenarios are presented — real situations, moral dilemmas, social stress tests.
          </p>
          <p className="text-muted leading-relaxed text-lg">
            Voters choose which personality type they&apos;d trust in that moment. Win, and your Elo climbs. Lose, and
            your fatal flaw is exposed.
          </p>
        </div>

        <div className="flex justify-center pt-8">
          <Link
            href="/create"
            className="group inline-flex items-center gap-3 px-10 py-5 bg-accent text-bg font-bold uppercase tracking-widest text-sm rounded-xl hover:-translate-y-1 transition-all shadow-[0_0_40px_rgba(232,201,122,0.2)]"
          >
            Enter the Arena
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </main>
  );
}
