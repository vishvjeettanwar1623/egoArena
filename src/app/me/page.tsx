"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowRight, History, Zap, Swords, AlertCircle } from "lucide-react";
import { getStorageItem, setStorageItem } from "@/utils/storage";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<any>(null);
  const [battles, setBattles] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Safety timeout
    const timer = setTimeout(() => {
      if (loading) {
        setError("Connection timeout. Please check your network or refresh.");
        setLoading(false);
      }
    }, 12000);

    async function fetchDashboard() {
      const supabase = createClient();
      
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) {
          router.push("/login?returnTo=/me");
          return;
        }
        setUser(authUser);
        
        // Fetch card linked to this user
        const { data: userCard } = await supabase.from("cards").select("*").eq("user_id", authUser.id).single();
        
        if (!userCard) {
          setLoading(false);
          clearTimeout(timer);
          return;
        }

        setCard(userCard);
        setStorageItem("egoarena_card_id", userCard.id);

        const { data: battlesData } = await supabase
          .from("battles")
          .select("*, scenario:scenarios(prompt)")
          .or(`card_a.eq.${userCard.id},card_b.eq.${userCard.id}`)
          .order("created_at", { ascending: false })
          .limit(10);

        if (battlesData) setBattles(battlesData);
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Failed to load dashboard.");
      } finally {
        setLoading(false);
        clearTimeout(timer);
      }
    }

    fetchDashboard();
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white/50">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p className="font-mono text-[10px] tracking-widest uppercase">
          Synchronizing Identity...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-6">
        <AlertCircle className="w-12 h-12 text-red mb-6 opacity-50" />
        <h2 className="text-xl font-bold mb-2">Network Issue</h2>
        <p className="text-white/40 font-mono text-xs mb-8 max-w-xs">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-white/5 border border-white/10 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] max-w-md mx-auto text-center px-6">
        <h2 className="text-2xl font-bold mb-4 font-sans text-white">Identity Unclaimed</h2>
        <p className="text-white/50 mb-8 font-mono text-xs leading-relaxed">
          You haven't stepped into the Arena yet.
        </p>
        <Link
          href="/create"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-sans font-bold uppercase tracking-widest text-xs rounded-full hover:bg-white/90 transition-colors"
        >
          Create Profile
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const winRate = card.wins + card.losses > 0 
    ? Math.round((card.wins / (card.wins + card.losses)) * 100) 
    : 0;

  return (
    <div className="wrap min-h-screen !pt-[25vh]">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* Minimal Header */}
        <div className="flex flex-col items-center text-center mb-24">
          <h1 className="text-[clamp(3.5rem,12vw,9rem)] font-sans font-black mb-5 tracking-tighter text-white leading-[0.85] py-2">
            {card.name || "Anon"}
          </h1>
          <div className="flex items-center gap-3 text-sm md:text-base font-mono uppercase tracking-widest">
            <span className="text-accent">{card.class}</span>
            <span className="text-white/20">/</span>
            <span className="text-white/50">{card.alignment}</span>
          </div>

          <div className="mt-12 flex flex-col md:flex-row items-center gap-6">
            {!user ? (
              <Link
                href="/login"
                className="px-8 py-3 bg-accent/10 text-accent border border-accent/20 font-bold rounded-full hover:bg-accent/20 transition-all font-mono text-xs uppercase tracking-widest"
              >
                Sign In to Save
              </Link>
            ) : (
              <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-3 rounded-full">
                <span className="font-mono text-xs text-white/50">{user.email}</span>
                <button
                  onClick={async () => {
                    const supabase = createClient();
                    await supabase.auth.signOut();
                    window.location.reload();
                  }}
                  className="font-mono text-xs uppercase tracking-widest text-red hover:text-red/80 transition-colors font-bold"
                >
                  Sign Out
                </button>
              </div>
            )}
            <Link
              href={`/card/${card.id}`}
              className="px-8 py-3 bg-white/5 border border-white/10 text-white/80 rounded-full hover:bg-white/10 hover:text-white transition-all font-mono text-[10px] uppercase tracking-widest font-bold"
            >
              Public Link
            </Link>
          </div>
        </div>

        {/* Clean Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-24 border-y border-white/10 py-12">
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-white mb-2">{card.elo}</div>
            <div className="font-mono text-xs text-white/40 uppercase tracking-widest font-bold">Rating</div>
          </div>
          <div className="text-center border-l border-white/10">
            <div className="text-4xl md:text-5xl font-bold text-white mb-2">{card.wins} - {card.losses}</div>
            <div className="font-mono text-xs text-white/40 uppercase tracking-widest font-bold">W - L</div>
          </div>
          <div className="text-center border-t md:border-t-0 border-white/10 md:border-l pt-8 md:pt-0">
            <div className="text-4xl md:text-5xl font-bold text-white mb-2 flex items-center justify-center gap-3">
              {card.streak}
              {card.streak >= 3 && <span className="text-accent2 text-2xl">🔥</span>}
              {card.streak <= -3 && <span className="text-blue-400 text-2xl">🧊</span>}
            </div>
            <div className="font-mono text-xs text-white/40 uppercase tracking-widest font-bold">Streak</div>
          </div>
          <div className="text-center border-t md:border-t-0 border-l border-white/10 pt-8 md:pt-0">
            <div className="text-4xl md:text-5xl font-bold text-white mb-2">{winRate}%</div>
            <div className="font-mono text-xs text-white/40 uppercase tracking-widest font-bold">Win Rate</div>
          </div>
        </div>

        {/* Minimal Battle Logs */}
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-8 opacity-40">
            <History className="w-3 h-3 translate-y-[1px]" />
            <h2 className="text-[10px] font-mono tracking-[0.2em] uppercase font-bold mb-0">Battle History</h2>
          </div>
          
          <div className="flex flex-col gap-2">
            {battles.length === 0 ? (
              <div className="py-16 text-center bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-white/40 font-mono text-sm tracking-widest uppercase mb-6 font-bold">No battles fought yet</p>
                <Link
                  href="/arena"
                  className="text-accent hover:text-accent/80 transition-colors font-mono text-sm uppercase tracking-widest font-bold inline-flex items-center gap-2"
                >
                  Enter the Arena <Swords className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              battles.map((battle) => {
                const isFinished = battle.status === "closed" || battle.winner !== null;
                const isWin = battle.winner === card.id;
                const isDraw = isFinished && !battle.winner; 
                
                const statusColor = !isFinished ? "text-accent" : isWin ? "text-green" : isDraw ? "text-white/40" : "text-red";
                const statusText = !isFinished ? "ACTIVE" : isWin ? "VICTORY" : isDraw ? "DRAW" : "DEFEAT";
                
                const scenarioPrompt = battle.scenario ? 
                  (Array.isArray(battle.scenario) ? battle.scenario[0]?.prompt : (battle.scenario as any).prompt) 
                  : "Unknown Scenario";

                return (
                  <div key={battle.id} className="group py-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-all px-4 -mx-4 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-sm text-white/80 leading-relaxed italic opacity-80 group-hover:opacity-100 transition-opacity">
                        {scenarioPrompt}
                      </p>
                    </div>
                    
                    <div className="shrink-0 flex items-center gap-6">
                      {isFinished && (
                        <div className="text-[10px] text-white/30 font-mono tracking-widest font-bold bg-white/5 px-2 py-1 rounded">
                          {battle.card_a === card.id ? battle.votes_a : battle.votes_b} - {battle.card_a === card.id ? battle.votes_b : battle.votes_a}
                        </div>
                      )}
                      <div className={`font-mono text-[10px] uppercase tracking-[0.2em] font-black w-24 text-right ${statusColor}`}>
                        {statusText}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
