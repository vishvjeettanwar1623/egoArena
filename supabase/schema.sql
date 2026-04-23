-- EgoArena Initial Schema 
-- You can run this in the Supabase SQL Editor

-- 1. CARDS
CREATE TABLE IF NOT EXISTS public.cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID DEFAULT NULL, -- UUID if authenticated, null if anon
    name TEXT DEFAULT 'Anon',
    class TEXT NOT NULL,
    alignment TEXT NOT NULL,
    stats JSONB NOT NULL,
    answers JSONB DEFAULT '{}', -- Store raw answers for re-assessment context
    fatal_flaw TEXT NOT NULL,
    elo INTEGER DEFAULT 1200,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    version INTEGER DEFAULT 1, -- Track how many times a card has been re-assessed
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. SCENARIOS
CREATE TABLE IF NOT EXISTS public.scenarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prompt TEXT NOT NULL,
    favors_stats TEXT[] DEFAULT '{}',
    category TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. BATTLES
CREATE TABLE IF NOT EXISTS public.battles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_a UUID REFERENCES public.cards(id) ON DELETE CASCADE,
    card_b UUID REFERENCES public.cards(id) ON DELETE CASCADE,
    scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE,
    votes_a INTEGER DEFAULT 0,
    votes_b INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active', -- 'active' or 'closed'
    ends_at TIMESTAMP WITH TIME ZONE,
    winner UUID REFERENCES public.cards(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. VOTES
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    battle_id UUID REFERENCES public.battles(id) ON DELETE CASCADE,
    voter_id UUID, -- For tracking unique voters 
    voted_for UUID REFERENCES public.cards(id) ON DELETE CASCADE,
    roast_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(battle_id, voter_id) -- A user can only vote once per battle
);

-- RLS (Row Level Security) 
-- For MVP, we will allow read access to everyone, and insert to everyone since we support anon users
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on cards" ON public.cards FOR SELECT USING (true);
CREATE POLICY "Allow public insert on cards" ON public.cards FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on cards" ON public.cards FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on scenarios" ON public.scenarios FOR SELECT USING (true);
CREATE POLICY "Allow public insert on scenarios" ON public.scenarios FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access on battles" ON public.battles FOR SELECT USING (true);
CREATE POLICY "Allow public insert on battles" ON public.battles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on battles" ON public.battles FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on votes" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Allow public insert on votes" ON public.votes FOR INSERT WITH CHECK (true);

-- Insert Dummy Scenarios for testing
INSERT INTO public.scenarios (prompt, category) VALUES 
('These two are the last people on Earth. Who rebuilds civilization?', 'survival'),
('A startup of 4 people — who do you want as your co-founder?', 'professional'),
('You''re stuck in an airport for 12 hours. Who are you spending it with?', 'social');
