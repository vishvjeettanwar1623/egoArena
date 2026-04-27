"use client";

import { useState, useEffect } from "react";
import { Loader2, ArrowRight, Swords, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getStorageItem } from "@/utils/storage";

// Maps raw DB stat keys to friendly display names.
// Handles both old cards (cunning) and new cards (intellect).
const STAT_DISPLAY: Record<string, string> = {
  discipline: "Disciplined",
  chaos:      "Chaotic",
  empathy:    "Empathetic",
  cunning:    "Intellectual",   // legacy key — old cards in DB
  intellect:  "Intellectual",   // new key — new cards
  resilience: "Resilient",
};

// Short label for stat bars inside revealed cards
const STAT_LABEL: Record<string, string> = {
  discipline: "Discipline",
  chaos:      "Chaos",
  empathy:    "Empathy",
  cunning:    "Intellect",
  intellect:  "Intellect",
  resilience: "Resilience",
};

// Derives a contextual question from the scenario prompt so every match feels unique.
const getDynamicQuestion = (prompt: string): string => {
  const p = prompt.toLowerCase();
  if (p.includes("rebuild") || p.includes("civilization") || p.includes("last")) return "Who survives to lead?";
  if (p.includes("co-founder") || p.includes("startup") || p.includes("business")) return "Who do you build with?";
  if (p.includes("airport") || p.includes("stuck") || p.includes("spend it with")) return "Who do you actually want around?";
  if (p.includes("burning") || p.includes("fire") || p.includes("danger") || p.includes("escape")) return "Who gets you out alive?";
  if (p.includes("unfair") || p.includes("fight") || p.includes("unjust")) return "Who stands their ground?";
  if (p.includes("secret") || p.includes("confess") || p.includes("truth")) return "Who do you actually trust?";
  if (p.includes("decade") || p.includes("start over") || p.includes("lost everything")) return "Who bounces back?";
  if (p.includes("betray") || p.includes("loyalty")) return "Who stays loyal under pressure?";
  if (p.includes("crisi") || p.includes("emergency") || p.includes("disaster")) return "Who keeps their head?";
  if (p.includes("power") || p.includes("control") || p.includes("leader")) return "Who do you follow?";
  return "Who wins this one?";
};

export default function ArenaPage() {
  const [matchData, setMatchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votingFor, setVotingFor] = useState<string | null>(null);
  
  // Traits to display on buttons
  const [traitA, setTraitA] = useState("");
  const [traitB, setTraitB] = useState("");

  const getDefiningTrait = (card: any, ignoreTrait?: string) => {
    let highestStat = "";
    let highestVal = -1;
    for (const [stat, val] of Object.entries(card.stats)) {
      if (stat === ignoreTrait) continue;
      if ((val as number) > highestVal) {
        highestVal = val as number;
        highestStat = stat;
      }
    }
    return highestStat;
  };

  const fetchMatch = async () => {
    const lastScenarioId = matchData?.scenario?.id;
    setLoading(true);
    setError(null);
    setHasVoted(false);
    setVotingFor(null);

    const timer = setTimeout(() => {
      if (loading) {
        setError("Matchmaking timed out. Please check your connection.");
        setLoading(false);
      }
    }, 15000);
    
    try {
      const cardId = getStorageItem("egoarena_card_id") || "";
      let url = `/api/arena/match?`;
      if (cardId) url += `cardId=${cardId}&`;
      if (lastScenarioId) url += `lastScenarioId=${lastScenarioId}`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.cards && data.cards.length === 2) {
        setMatchData(data);
        
        // Calculate traits for buttons
        const tA = getDefiningTrait(data.cards[0]);
        let tB = getDefiningTrait(data.cards[1]);
        if (tA === tB) {
          tB = getDefiningTrait(data.cards[1], tA); // Fallback to 2nd highest if tie
        }
        setTraitA(tA);
        setTraitB(tB);

      } else {
        setError(data.error || "Failed to find a match");
      }
    } catch (e: any) {
      console.error(e);
      setError("Network error. The Arena is temporarily unreachable.");
    } finally {
      setLoading(false);
      clearTimeout(timer);
    }
  };

  useEffect(() => {
    fetchMatch();
  }, []);

  const handleVote = async (winnerId: string, loserId: string) => {
    if (hasVoted) return;
    
    setVotingFor(winnerId);
    setHasVoted(true);
    
    try {
      await fetch("/api/arena/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerId, loserId }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const renderCard = (card: any, isRevealed: boolean) => {
    return (
      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex-1 bg-white/5 border border-white/10 rounded-3xl p-8 transition-all duration-500 ${isRevealed ? 'scale-100' : 'blur-md opacity-40 scale-95 pointer-events-none'}`}
      >
        <div className="mb-6">
          <h3 className="text-2xl font-bold mb-1">{card.name}</h3>
          <p className="font-mono text-[10px] text-accent uppercase tracking-widest">{card.class} / {card.alignment}</p>
        </div>

        <div className="space-y-4 mb-8">
          {Object.entries(card.stats).map(([stat, val]) => {
            const isDefining = stat === traitA || stat === traitB;
            return (
              <div key={stat} className="flex items-center gap-3">
                <span className={`w-20 text-[10px] font-mono uppercase tracking-widest truncate ${isDefining ? 'text-accent font-bold' : 'text-white/40'}`}>
                  {STAT_LABEL[stat] || stat}
                </span>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${val}%`, 
                      backgroundColor: isDefining ? '#5ea7a0' : 'rgba(255,255,255,0.2)' 
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-black/30 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-red/40" />
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-red/60 mb-2 font-bold">Fatal Flaw</div>
          <p className="text-base md:text-lg text-white/90 leading-relaxed italic font-sans">
            "{card.fatal_flaw}"
          </p>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white/50">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p className="font-mono text-[10px] tracking-widest uppercase">
          Matchmaking...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-6">
        <AlertCircle className="w-12 h-12 text-red mb-6 opacity-30" />
        <h2 className="text-xl font-bold mb-2">Arena Entry Failed</h2>
        <p className="text-white/40 font-mono text-xs mb-8 max-w-xs">{error}</p>
        <button 
          onClick={fetchMatch}
          className="px-8 py-3 bg-white/5 border border-white/10 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="wrap min-h-screen !pt-[15vh]">
      <div className="max-w-4xl mx-auto px-4 flex flex-col items-center mt-8">
        
        {!matchData?.cards?.length ? (
           <div className="py-32 text-center text-white/40 font-mono text-sm uppercase tracking-widest">
             Not enough cards in the database to start a match.
           </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div 
              key={matchData.scenario.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center"
            >
              
              {/* Clean Scenario Block */}
              <div className="text-center mb-16 max-w-3xl">
                <div className="font-mono text-sm text-accent tracking-[0.3em] uppercase mb-8 font-bold">
                  Scenario
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-8 leading-tight drop-shadow-lg">
                  "{matchData.scenario.prompt}"
                </h2>
                <div className="flex items-center justify-center">
                  <div className="bg-accent/10 border border-accent/20 rounded-full px-6 py-3 w-fit mx-auto flex items-center justify-center">
                    <p className="text-accent font-mono text-sm uppercase tracking-widest font-bold leading-none text-center">
                      {getDynamicQuestion(matchData.scenario.prompt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Trait Buttons (Voting Phase) */}
              <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl mb-16">
                <button
                  onClick={() => handleVote(matchData.cards[0].id, matchData.cards[1].id)}
                  disabled={hasVoted}
                  className={`flex-1 py-10 px-8 rounded-3xl border-2 transition-all duration-300 font-sans font-bold text-2xl flex flex-col items-center justify-center gap-2 group ${
                    hasVoted 
                      ? votingFor === matchData.cards[0].id 
                        ? "bg-accent/20 text-accent border-accent scale-105 shadow-[0_0_40px_rgba(94,167,160,0.3)]" 
                        : "bg-white/5 text-white/30 border-white/5 opacity-50 grayscale"
                      : "bg-white/5 hover:bg-accent/10 text-white border-white/10 hover:border-accent/50 hover:shadow-[0_0_30px_rgba(94,167,160,0.2)] hover:-translate-y-2"
                  }`}
                >
                  <span className="text-xs font-mono tracking-widest text-white/50 uppercase group-hover:text-accent/80 transition-colors">Candidate Alpha</span>
                  <span className="capitalize text-3xl md:text-4xl">{STAT_DISPLAY[traitA] || traitA}</span>
                </button>
                
                <div className="flex items-center justify-center md:px-2 py-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <Swords className="w-5 h-5 text-white/20" />
                  </div>
                </div>

                <button
                  onClick={() => handleVote(matchData.cards[1].id, matchData.cards[0].id)}
                  disabled={hasVoted}
                  className={`flex-1 py-10 px-8 rounded-3xl border-2 transition-all duration-300 font-sans font-bold text-2xl flex flex-col items-center justify-center gap-2 group ${
                    hasVoted 
                      ? votingFor === matchData.cards[1].id 
                        ? "bg-accent/20 text-accent border-accent scale-105 shadow-[0_0_40px_rgba(94,167,160,0.3)]" 
                        : "bg-white/5 text-white/30 border-white/5 opacity-50 grayscale"
                      : "bg-white/5 hover:bg-accent/10 text-white border-white/10 hover:border-accent/50 hover:shadow-[0_0_30px_rgba(94,167,160,0.2)] hover:-translate-y-2"
                  }`}
                >
                  <span className="text-xs font-mono tracking-widest text-white/50 uppercase group-hover:text-accent/80 transition-colors">Candidate Beta</span>
                  <span className="capitalize text-3xl md:text-4xl">{STAT_DISPLAY[traitB] || traitB}</span>
                </button>
              </div>

              {/* Revealed Cards */}
              <div className="w-full flex flex-col md:flex-row gap-8 mb-12">
                {renderCard(matchData.cards[0], hasVoted)}
                {renderCard(matchData.cards[1], hasVoted)}
              </div>

              {/* Next Match Button */}
              {hasVoted && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8"
                >
                  <button
                    onClick={fetchMatch}
                    className="group inline-flex items-center gap-3 px-10 py-5 bg-white text-black font-bold uppercase tracking-widest text-sm rounded-2xl hover:bg-accent transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                  >
                    Next Match
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
