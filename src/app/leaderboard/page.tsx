import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Trophy, Skull, Swords } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  // Fetch Top 10 by Elo
  const { data: topCards } = await supabase
    .from("cards")
    .select("*")
    .order("elo", { ascending: false })
    .limit(10);

  // Fetch Bottom 10 by Elo (or we could use losses/streak, but lowest elo is simple for shame)
  const { data: bottomCards } = await supabase
    .from("cards")
    .select("*")
    .order("elo", { ascending: true })
    .limit(10);

  const renderList = (cards: any[], isShame: boolean) => {
    return (
      <div className="flex flex-col gap-3">
        {cards?.map((card, idx) => (
          <Link
            href={`/card/${card.id}`}
            key={card.id}
            className={`flex items-center p-4 rounded-xl border transition-all ${
              isShame
                ? "bg-[#201515] border-red/20 hover:border-red/40"
                : "bg-[#1a201a] border-green/20 hover:border-green/40"
            }`}
          >
            <div
              className={`w-8 h-8 flex items-center justify-center font-mono text-sm rounded-full mr-4 shrink-0 ${
                isShame ? "bg-red/20 text-red" : "bg-green/20 text-green"
              }`}
            >
              #{idx + 1}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-lg truncate">
                  {card.name || "Anon"}
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider text-muted hidden sm:inline-block">
                  {card.class}
                </span>
              </div>
              <div className="text-xs text-muted truncate">
                {card.fatal_flaw}
              </div>
            </div>

            <div className="text-right shrink-0 ml-4">
              <div className="font-mono text-lg font-bold">
                {card.elo}
              </div>
              <div className="text-[10px] uppercase font-mono text-muted tracking-widest">
                Elo
              </div>
            </div>
          </Link>
        ))}
        {!cards?.length && (
          <div className="text-center py-8 text-muted font-mono text-sm">
            Not enough data yet.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="wrap relative min-h-screen !pt-[10vh]">

      <div className="mb-12 text-center flex flex-col items-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 text-accent mb-4">
          <Trophy className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-sans font-bold mb-2">Leaderboard</h1>
        <p className="text-muted text-sm font-mono tracking-widest uppercase">
          The Best and the Worst
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
        {/* Hall of Fame */}
        <div>
          <div className="flex items-center gap-3 mb-6 border-b border-border-subtle pb-4">
            <Trophy className="text-green w-5 h-5" />
            <h2 className="text-xl font-bold">Hall of Fame</h2>
          </div>
          {renderList(topCards || [], false)}
        </div>

        {/* Hall of Shame */}
        <div>
          <div className="flex items-center gap-3 mb-6 border-b border-border-subtle pb-4">
            <Skull className="text-red w-5 h-5" />
            <h2 className="text-xl font-bold">Hall of Shame</h2>
          </div>
          {renderList(bottomCards || [], true)}
        </div>
      </div>
    </div>
  );
}
