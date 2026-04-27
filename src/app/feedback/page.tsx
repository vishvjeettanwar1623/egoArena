"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";

const RATING_LABELS: Record<number, string> = {
  1: "Awful", 2: "Bad", 3: "Meh", 4: "Decent",
  5: "Good", 6: "Pretty Good", 7: "Great", 8: "Excellent",
  9: "Incredible", 10: "Addicted",
};

const STEPS = [
  { id: "how_found", type: "mcq", required: false, label: "01", question: "How did you find EgoArena?", options: ["X / Twitter", "Friend told me", "Reddit", "Search engine", "Just stumbled in"] },
  { id: "card_accuracy", type: "rating", required: true, label: "02", question: "How accurate was your Character Card?", sub: "Did the AI actually nail you?" },
  { id: "favourite_feature", type: "mcq", required: false, label: "03", question: "What's the best part of EgoArena?", options: ["The character card", "Arena battles", "The leaderboard", "The personality quiz itself", "The Fatal Flaw"] },
  { id: "missing_feature", type: "mcq", required: false, label: "04", question: "What feels missing?", options: ["More questions / deeper quiz", "Better Arena experience", "Social features (friends, challenges)", "Profile customisation", "Mobile app"] },
  { id: "recommend", type: "nps", required: true, label: "05", question: "How likely are you to tell someone about EgoArena?", sub: "0 = Never. 10 = Already texting them." },
  { id: "open_feedback", type: "text", required: false, label: "06", question: "Anything else on your mind?", placeholder: "Bugs, ideas, rants, compliments — all welcome." },
  { id: "email", type: "email", required: false, label: "07", question: "Drop your email if you want a reply.", placeholder: "you@example.com (optional)" },
];

export default function FeedbackPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const current = STEPS[step];
  const progress = ((step) / STEPS.length) * 100;
  const isLast = step === STEPS.length - 1;
  const canAdvance = !current.required || answers[current.id] !== undefined;

  const setAnswer = (val: string | number) => {
    setAnswers((prev) => ({ ...prev, [current.id]: val }));
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };

  const handlePrev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const payload: Record<string, string> = {};
      STEPS.forEach((s) => {
        if (answers[s.id] !== undefined) {
          payload[s.question] = String(answers[s.id]);
        }
      });

      const res = await fetch("https://formspree.io/f/mbdqeqoy", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-10 h-10 text-accent" />
          </div>
          <h1 className="text-4xl font-black font-sans mb-4">Received.</h1>
          <p className="text-white/50 leading-relaxed mb-10 font-mono text-sm">
            Your feedback has been logged. The Arena will be shaped by people like you.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-bg font-bold uppercase tracking-widest text-sm rounded-xl hover:-translate-y-1 transition-all"
          >
            Back to EgoArena
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="wrap min-h-screen !pt-[15vh] pb-24">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-12">
          <div className="font-mono text-[10px] tracking-[0.3em] text-accent uppercase mb-3">
            EgoArena — Feedback
          </div>
          <h1 className="text-4xl md:text-5xl font-black font-sans tracking-tighter leading-tight mb-2">
            Shape the Arena.
          </h1>
          <p className="text-white/40 font-mono text-xs">
            {STEPS.length} quick questions. Brutally honest answers preferred.
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-px bg-white/5 mb-2 rounded overflow-hidden">
          <motion.div
            className="h-full bg-accent rounded"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <div className="flex justify-between font-mono text-[10px] text-white/20 uppercase tracking-widest mb-12">
          <span>
            {step === STEPS.length ? "Done" : `Step ${step + 1} of ${STEPS.length}`}
          </span>
          {!current.required && <span className="text-white/20">Optional</span>}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
          >
            <div className="font-mono text-xs text-accent/50 tracking-[0.3em] uppercase mb-3">
              {current.label}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold font-sans mb-2 leading-snug">
              {current.question}
            </h2>
            {current.sub && (
              <p className="text-white/40 text-sm font-mono mb-8">{current.sub}</p>
            )}
            {!current.sub && <div className="mb-8" />}

            {/* MCQ */}
            {current.type === "mcq" && (
              <div className="flex flex-col gap-3">
                {current.options?.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setAnswer(opt);
                      setTimeout(handleNext, 300);
                    }}
                    className={`text-left px-5 py-4 rounded-xl border transition-all duration-200 font-sans text-base ${
                      answers[current.id] === opt
                        ? "border-accent bg-accent/10 text-white"
                        : "border-white/8 bg-white/[0.03] text-white/70 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
                <button
                  onClick={handleNext}
                  className="text-left px-5 py-4 rounded-xl border border-dashed border-white/10 text-white/30 hover:text-white/50 transition-all font-mono text-xs uppercase tracking-widest"
                >
                  Skip this one →
                </button>
              </div>
            )}

            {/* Rating 1-10 */}
            {current.type === "rating" && (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setAnswer(n)}
                      className={`aspect-square rounded-xl font-mono font-bold text-sm border transition-all duration-150 ${
                        answers[current.id] === n
                          ? "bg-accent text-bg border-accent scale-110 shadow-[0_0_20px_rgba(232,201,122,0.4)]"
                          : (hoverRating ?? 0) >= n
                          ? "bg-accent/20 border-accent/40 text-accent"
                          : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="h-6 font-mono text-sm text-accent tracking-widest text-center transition-all">
                  {answers[current.id]
                    ? RATING_LABELS[answers[current.id] as number] ?? ""
                    : hoverRating
                    ? RATING_LABELS[hoverRating] ?? ""
                    : ""}
                </div>
              </div>
            )}

            {/* NPS 0-10 */}
            {current.type === "nps" && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-6 sm:grid-cols-11 gap-2">
                  {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                    <button
                      key={n}
                      onClick={() => setAnswer(n)}
                      className={`aspect-square rounded-xl font-mono font-bold text-sm border transition-all duration-150 ${
                        answers[current.id] === n
                          ? "bg-accent text-bg border-accent scale-110 shadow-[0_0_20px_rgba(232,201,122,0.4)]"
                          : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between font-mono text-[10px] text-white/20 uppercase tracking-widest">
                  <span>Never</span><span>Already did</span>
                </div>
              </div>
            )}

            {/* Open text */}
            {current.type === "text" && (
              <div className="flex flex-col gap-4">
                <textarea
                  value={(answers[current.id] as string) || ""}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={current.placeholder}
                  rows={5}
                  className="w-full p-4 rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder:text-white/20 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none font-sans text-base transition-all"
                />
              </div>
            )}

            {/* Email */}
            {current.type === "email" && (
              <input
                type="email"
                value={(answers[current.id] as string) || ""}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={current.placeholder}
                className="w-full p-4 rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder:text-white/20 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent font-sans text-base transition-all"
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Error */}
        {error && (
          <p className="mt-4 text-red font-mono text-xs">{error}</p>
        )}

        {/* Nav */}
        <div className="flex items-center justify-between mt-12 pt-6 border-t border-white/5">
          <button
            onClick={handlePrev}
            disabled={step === 0}
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-white/30 hover:text-white disabled:opacity-0 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {isLast ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-bg font-bold uppercase tracking-widest text-sm rounded-xl hover:-translate-y-1 transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(232,201,122,0.2)]"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
              ) : (
                <>Submit Feedback <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          ) : (
            current.type !== "mcq" && (
              <button
                onClick={handleNext}
                disabled={!canAdvance}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-mono text-xs uppercase tracking-widest rounded-xl transition-all disabled:opacity-30"
              >
                {current.required ? "Next" : "Next →"}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )
          )}
        </div>

      </div>
    </div>
  );
}
