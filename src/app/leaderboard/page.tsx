import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Trophy, Swords, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  // Fetch All Cards by Elo descending
  const { data: cards } = await supabase
    .from("cards")
    .select("*")
    .order("elo", { ascending: false })
    .limit(50);

  return (
    <div className="wrap relative min-h-screen !pt-[15vh]">
      <div className="max-w-3xl mx-auto px-6">
        
        {/* Simplified Header */}
        <div className="mb-20 text-center flex flex-col items-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 text-accent mb-6 transform rotate-3 shadow-[0_0_20px_rgba(232,201,122,0.15)]">
            <Trophy className="w-7 h-7" />
          </div>
          <h1 className="text-4xl md:text-5xl font-sans font-black mb-4 tracking-tight">Global Rankings</h1>
          <p className="text-white/40 text-xs md:text-sm font-mono tracking-[0.2em] uppercase max-w-sm leading-relaxed">
            The hierarchy of egos, sorted by raw arena performance.
          </p>
        </div>

        {/* Unified List */}
        <div className="flex flex-col gap-2">
          {cards?.map((card, idx) => {
            const isTop3 = idx < 3;
            const rankColor = idx === 0 ? "text-accent" : idx === 1 ? "text-white/80" : idx === 2 ? "text-orange-400" : "text-white/20";
            
            return (
              <Link
                href={`/card/${card.id}`}
                key={card.id}
                className="group flex items-center p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300"
              >
                <div className={`w-12 h-12 flex items-center justify-center font-mono text-lg font-black mr-4 shrink-0 transition-colors ${rankColor}`}>
                  {idx + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-lg truncate group-hover:text-accent transition-colors">
                      {card.name || "Anon"}
                    </span>
                    <span className="text-[9px] uppercase font-mono tracking-widest text-white/20 font-bold px-2 py-0.5 border border-white/5 rounded">
                      {card.class}
                    </span>
                  </div>
                  <div className="text-xs text-white/40 truncate italic opacity-60 group-hover:opacity-100 transition-opacity">
                    {card.fatal_flaw}
                  </div>
                </div>

                <div className="text-right shrink-0 ml-6 pl-6 border-l border-white/5">
                  <div className="flex items-center justify-end gap-1.5 font-mono text-xl font-black text-white">
                    <Zap className="w-3 h-3 text-accent fill-accent" />
                    {card.elo}
                  </div>
                  <div className="text-[10px] uppercase font-mono text-white/20 tracking-[0.2em] font-bold">
                    Rating
                  </div>
                </div>
              </Link>
            );
          })}
          
          {!cards?.length && (
            <div className="text-center py-24 bg-white/5 border border-dashed border-white/10 rounded-3xl">
              <Swords className="w-8 h-8 text-white/10 mx-auto mb-4" />
              <p className="text-white/30 font-mono text-sm tracking-widest uppercase">The Arena is currently empty.</p>
            </div>
          )}
        </div>

        <div className="mt-20 py-12 text-center opacity-20 border-t border-white/5">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em]">Total Participants: {cards?.length || 0}</p>
        </div>

      </div>
    </div>
  );
}
