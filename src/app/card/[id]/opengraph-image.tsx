import { ImageResponse } from 'next/og';
import { supabase } from "@/lib/supabase";

export const runtime = 'edge';

export const alt = 'EgoArena Character Card';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image({ params }: { params: { id: string } }) {
  const { data: card } = await supabase
    .from('cards')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!card) {
    return new ImageResponse(
      (
        <div style={{ background: '#0a0a0b', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ color: '#e8c97a', fontSize: 60, fontFamily: 'sans-serif' }}>Card Not Found</h1>
        </div>
      ),
      { ...size }
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: '#0a0a0b',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          color: '#f0ede8',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '600px',
            backgroundColor: '#111113',
            border: '2px solid #333',
            borderRadius: '16px',
            padding: '40px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div style={{ display: 'flex', fontSize: '18px', color: '#7b5ea7', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '10px' }}>
            {card.class} · {card.alignment}
          </div>
          <div style={{ display: 'flex', fontSize: '48px', fontWeight: 'bold', marginBottom: '30px' }}>
            {card.name || 'Anon'}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
            {['discipline', 'chaos', 'empathy', 'intellect', 'resilience'].map((stat) => (
              <div key={stat} style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <span style={{ width: '140px', color: '#7a7875', fontSize: '20px', textTransform: 'capitalize' }}>{stat}</span>
                <div style={{ display: 'flex', flex: 1, height: '12px', backgroundColor: '#2a2a2a', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', height: '100%', width: `${card.stats[stat] || 0}%`, backgroundColor: stat === 'discipline' ? '#7b5ea7' : stat === 'chaos' ? '#c45f3a' : stat === 'empathy' ? '#4caf82' : stat === 'intellect' ? '#e8c97a' : '#5ea7a0' }} />
                </div>
                <span style={{ width: '50px', textAlign: 'right', color: '#e8c97a', fontSize: '20px', marginLeft: '10px' }}>{card.stats[stat] || 0}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(196, 95, 58, 0.1)', border: '1px solid rgba(196, 95, 58, 0.3)', borderRadius: '8px', padding: '20px' }}>
            <span style={{ fontSize: '16px', color: '#c45f3a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Fatal Flaw</span>
            <span style={{ fontSize: '24px', color: '#c45f3a', lineHeight: '1.4' }}>{card.fatal_flaw}</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', marginTop: '40px', fontSize: '28px', color: '#7a7875', letterSpacing: '0.3em', fontWeight: 'bold' }}>
          EGO ARENA
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
