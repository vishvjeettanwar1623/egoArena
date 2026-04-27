# EgoArena 🎭

**Your personality is a character. Your character has a record. And the internet decides if you'd survive.**

EgoArena is a brutally honest self-reflection game. Answer 10 psychological stress-test questions to forge your "Character Card," then enter the Arena to see how your personality holds up against the world.

---

## 🔥 Features

- **AI-Powered Character Forge**: A deep-learning analysis of your answers to generate a unique archetype, D&D alignment, and 5 core psychological stats (Discipline, Chaos, Empathy, Intellect, Resilience).
- **The Fatal Flaw**: Every card comes with a sharp, unsettlingly accurate behavioral vulnerability.
- **The Arena**: Vote on high-stakes scenarios or let the AI simulate a 1v1 battle based on character stats and flaws.
- **Global Leaderboard**: An Elo-based ranking system where the most "effective" personalities climb to the top.
- **Interactive Feedback**: A dedicated system to help shape the future of the Arena.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **AI Engine**: [OpenRouter](https://openrouter.ai/) / OpenAI
- **Styling**: Tailwind CSS (Custom Dark Theme)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: Lucide React

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- A Supabase project
- An OpenRouter or OpenAI API Key

### 2. Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=openrouter/auto # or your preferred model
```

### 3. Database Setup
Run the contents of `supabase/schema.sql` in your Supabase SQL Editor to initialize the `cards`, `scenarios`, and `battles` tables.

### 4. Installation & Run
```bash
npm install
npm run dev
```

---

## 📜 License
Personal Project / MIT

## 💬 Feedback
Got ideas or found a bug? Send it via the in-app feedback form or email us at **egoarenalive@gmail.com**.
