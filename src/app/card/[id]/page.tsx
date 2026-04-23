import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function CardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const { data: card, error } = await supabase
    .from("cards")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !card) {
    notFound();
  }

  return (
    <div className="wrap relative min-h-screen py-12 flex flex-col items-center">
      <h1 className="text-3xl font-sans font-bold mb-8">Character Card</h1>
      
      <div className="relative overflow-hidden p-6 max-w-[320px] w-full rounded-2xl bg-gradient-to-br from-[#1a1520] to-[#0f1018] border border-accent3/40 mb-12 shadow-2xl">
        <div className="absolute -top-10 -right-10 w-[120px] h-[120px] bg-[radial-gradient(circle,rgba(123,94,167,0.3),transparent_70%)] pointer-events-none" />
        
        <div className="font-mono text-[10px] tracking-[0.15em] text-accent3 uppercase mb-1.5 break-words flex items-center justify-between">
          <span>{card.class} · {card.alignment}</span>
        </div>

        {/* Mask Image */}
        {card.avatar_url && (
          <div className="mb-4 relative rounded-xl overflow-hidden aspect-square border border-white/10 shadow-2xl">
            <img src={card.avatar_url} alt="Mask" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          <div className="text-[1.4rem] font-bold font-sans">
            {card.name || "Anon"}
          </div>
          {card.streak >= 3 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent2/20 text-accent2 border border-accent2/30 text-xs font-bold uppercase tracking-wider" title="On Fire">
              🔥 {card.streak}
            </span>
          )}
          {card.streak <= -3 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold uppercase tracking-wider" title="Humbled">
              🧊 {card.streak}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3 mb-6">
          {Object.entries(card.stats).map(([stat, val]: any) => {
            const displayLabel = stat === 'cunning' ? 'intellect' : stat;
            const barColor = 
              stat === 'discipline' ? '#7b5ea7' : 
              stat === 'chaos' ? '#c45f3a' : 
              stat === 'empathy' ? '#4caf82' : 
              (stat === 'intellect' || stat === 'cunning') ? '#e8c97a' : 
              '#5ea7a0';

            return (
              <div key={stat} className="flex items-center gap-2 text-xs">
                <span className="w-20 text-muted font-mono capitalize">
                  {displayLabel}
                </span>
                <div className="flex-1 h-1.5 bg-white/10 rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-1000"
                    style={{ width: `${val}%`, backgroundColor: barColor }}
                  />
                </div>
                <span className="font-mono text-[11px] text-accent min-w-[24px] text-right">
                  {val}
                </span>
              </div>
            );
          })}
        </div>

        <div className="bg-accent2/10 border border-accent2/25 rounded-lg p-3 text-xs text-accent2">
          <span className="font-mono text-[10px] block mb-1 opacity-70 tracking-[0.1em] uppercase">
            Fatal Flaw
          </span>
          <span className="leading-relaxed">
            {card.fatal_flaw}
          </span>
        </div>

        <div className="flex gap-4 mt-6 pt-4 border-t border-white/10 text-center justify-around font-mono text-[11px]">
          <div>
            <span className="block text-lg font-bold text-green mb-0.5">{card.wins || 0}</span>
            <span className="text-muted">Wins</span>
          </div>
          <div>
            <span className="block text-lg font-bold text-red mb-0.5">{card.losses || 0}</span>
            <span className="text-muted">Losses</span>
          </div>
          <div>
            <span className="block text-lg font-bold text-accent mb-0.5">{card.elo || 1200}</span>
            <span className="text-muted">ELO</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button className="px-6 py-3 bg-surface2 border border-border-strong rounded-sm text-sm font-sans hover:bg-white/5 transition-colors">
          Share Card
        </button>
        <Link
          href="/arena"
          className="px-6 py-3 bg-accent text-bg border border-accent font-bold rounded-sm text-sm font-sans hover:bg-accent/90 transition-colors"
        >
          Enter the Arena
        </Link>
      </div>
    </div>
  );
}
