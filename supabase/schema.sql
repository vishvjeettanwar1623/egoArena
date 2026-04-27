-- EgoArena Schema
-- Run this in the Supabase SQL Editor to set up the database.

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

-- RLS (Row Level Security)
-- Read access is public; insert/update is open for MVP (supports anon users)
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on cards" ON public.cards FOR SELECT USING (true);
CREATE POLICY "Allow public insert on cards" ON public.cards FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on cards" ON public.cards FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on scenarios" ON public.scenarios FOR SELECT USING (true);
CREATE POLICY "Allow public insert on scenarios" ON public.scenarios FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access on battles" ON public.battles FOR SELECT USING (true);
CREATE POLICY "Allow public insert on battles" ON public.battles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on battles" ON public.battles FOR UPDATE USING (true);

