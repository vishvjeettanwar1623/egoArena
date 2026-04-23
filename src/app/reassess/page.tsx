"use client";

import { useState, useEffect } from "react";
import { ArrowRight, ArrowLeft, Loader2, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ReassessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardId, setCardId] = useState<string | null>(null);
  const [evolutionNote, setEvolutionNote] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const id = localStorage.getItem("egoarena_card_id");
      if (!id) {
        router.push("/create");
        return;
      }
      setCardId(id);

      try {
        const res = await fetch(`/api/reassess/questions?cardId=${id}`);
        const data = await res.json();
        if (data.questions) {
          setQuestions(data.questions);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);

  const handleNext = () => {
    if (currentStep < questions.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleAnswer = (val: string) => {
    setAnswers((prev) => ({ ...prev, [questions[currentStep].id]: val }));
    if (questions[currentStep].type === "mcq") {
      setTimeout(handleNext, 300);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reassess/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, answers }),
      });
      const data = await res.json();
      if (res.ok) {
        setEvolutionNote(data.evolution_note);
        setTimeout(() => {
          router.push("/me");
        }, 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <Zap className="w-6 h-6 text-accent" />
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">Synchronizing Psyche...</p>
        </div>
      </div>
    );
  }

  const q = questions[currentStep];
  const progress = (currentStep / questions.length) * 100;

  return (
    <div className="wrap relative min-h-screen flex flex-col">
      <div className="w-full mb-12">
        <div className="w-full h-1 bg-white/5 rounded overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300 shadow-[0_0_10px_rgba(94,167,160,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-4 font-mono text-[10px] text-white/30 tracking-widest uppercase">
          <span>Identity Re-assessment</span>
          <span>{currentStep + 1} / {questions.length}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
        {currentStep === questions.length ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            {!isSubmitting && !evolutionNote ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-4xl font-bold mb-6">Evolution is inevitable.</h2>
                <button
                  onClick={handleSubmit}
                  className="px-10 py-5 bg-white text-black font-bold uppercase tracking-widest rounded-full hover:bg-accent transition-all"
                >
                  Confirm Re-assessment
                </button>
              </motion.div>
            ) : evolutionNote ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <Zap className="w-12 h-12 text-accent mb-8 mx-auto" />
                <h2 className="text-3xl font-bold mb-4">Identity Evolved</h2>
                <p className="text-accent font-mono italic text-lg leading-relaxed">{evolutionNote}</p>
                <p className="mt-12 text-white/40 font-mono text-xs uppercase tracking-widest">Returning to Dashboard...</p>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center">
                <Loader2 className="w-12 h-12 animate-spin text-accent mb-6" />
                <p className="font-mono text-sm tracking-widest uppercase">Analyzing Shifts...</p>
              </div>
            )}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1"
            >
              <div className="mb-12">
                <span className="font-mono text-accent text-xs uppercase tracking-widest block mb-4">Deep Probe</span>
                <h2 className="text-3xl md:text-4xl font-bold leading-tight">{q.prompt}</h2>
              </div>

              {q.type === "mcq" ? (
                <div className="flex flex-col gap-4">
                  {q.options?.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(opt)}
                      className="text-left p-6 rounded-2xl border border-white/10 bg-white/5 hover:border-accent/50 hover:bg-accent/5 transition-all text-lg"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  <textarea
                    value={answers[q.id] || ""}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    className="w-full min-h-[200px] p-6 rounded-2xl border border-white/10 bg-white/5 text-xl text-white placeholder:text-white/10 focus:border-accent focus:outline-none transition-all"
                    placeholder="Speak your truth..."
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleNext}
                      disabled={!(answers[q.id] || "").trim()}
                      className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-accent transition-all disabled:opacity-30"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <div className="mt-auto pt-8 flex justify-between">
        <button
          onClick={handlePrev}
          disabled={currentStep === 0 || isSubmitting}
          className="text-white/20 hover:text-white transition-colors font-mono text-[10px] uppercase tracking-widest"
        >
          Previous Step
        </button>
      </div>
    </div>
  );
}
