"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Get returnTo from URL
  const getReturnTo = () => {
    if (typeof window === "undefined") return "/me";
    return new URLSearchParams(window.location.search).get("returnTo") || "/me";
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const supabase = createClient();
    const returnTo = getReturnTo();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(returnTo)}`,
      },
    });
    // Page will redirect, no need to setGoogleLoading(false)
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const returnTo = getReturnTo();
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(returnTo)}`,
      },
    });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("✓ Check your email for the magic link!");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold font-sans mb-2 text-white">Claim Your Identity</h1>
          <p className="text-white/50 text-sm">
            Sign in to create your Character Card and track your record.
          </p>
        </div>

        {/* Google Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white text-[#1a1a1a] font-bold rounded-xl hover:bg-white/90 transition-all mb-6 disabled:opacity-70 shadow-lg hover:-translate-y-0.5 hover:shadow-xl"
        >
          {googleLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          <span>{googleLoading ? "Redirecting..." : "Continue with Google"}</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="font-mono text-[10px] text-white/30 uppercase tracking-widest">or use email</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Magic Link */}
        <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-white placeholder:text-white/30 focus:outline-none focus:border-accent transition-colors text-sm"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 text-white font-mono text-xs uppercase tracking-widest rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send Magic Link <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        {message && (
          <div className={`mt-5 p-4 rounded-xl text-sm text-center font-mono ${message.startsWith("✓") ? "bg-green/10 border border-green/20 text-green" : "bg-red/10 border border-red/20 text-red"}`}>
            {message}
          </div>
        )}

      </div>
    </div>
  );
}
