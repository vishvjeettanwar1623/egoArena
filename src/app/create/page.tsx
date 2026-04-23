"use client";

import { useState, useEffect } from "react";
import { ArrowRight, ArrowLeft, Loader2, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePostHog } from 'posthog-js/react';
import { createClient } from "@/lib/supabase/client";

const QUESTIONS = [
  {
    id: "name",
    type: "text",
    prompt: "Before we begin. Please provide us your name:",
    placeholder: "Your Name",
  },
  {
    id: "q1",
    type: "mcq",
    prompt: "1. Your friend is crying. Your first instinct is:",
    options: [
      "Fix the problem",
      "Listen",
      "Awkwardly offer snacks",
      "Fix the problem while they're still talking",
    ],
  },
  {
    id: "q2",
    type: "text",
    prompt: "2. You are handed €10,000 and 24 hours. What happens?",
    placeholder: "Be honest. Or at least interesting.",
  },
  {
    id: "q3",
    type: "text",
    prompt: "3. What's the lie you tell yourself most often?",
    placeholder: "Example: 'I'll just watch one episode'",
  },
  {
    id: "q4",
    type: "mcq",
    prompt: "4. Your group is lost. You:",
    options: [
      "Take charge",
      "Follow confidently",
      "Follow skeptically",
      "Quietly find the exit alone",
    ],
  },
  {
    id: "q5",
    type: "mcq",
    prompt: "5. Pick the sentence that describes you:",
    options: [
      "I have too many ideas",
      "I finish what I start",
      "I adapt to whoever I'm with",
      "I don't know yet",
    ],
  },
  {
    id: "q6",
    type: "text",
    prompt: "6. What do people misunderstand about you?",
    placeholder: "...",
  },
  {
    id: "q7",
    type: "mcq",
    prompt: "7. Something is unfair. You:",
    options: [
      "Fight it loudly",
      "Work around it quietly",
      "Accept it",
      "Make it work for you",
    ],
  },
  {
    id: "q8",
    type: "mcq",
    prompt: "8. At your worst, you are:",
    options: ["Controlling", "Avoidant", "Chaotic", "Cold"],
  },
  {
    id: "q9",
    type: "text",
    prompt: "9. Someone insults you publicly. Your honest reaction:",
    placeholder: "...",
  },
  {
    id: "q10",
    type: "text",
    prompt: "10. What would the 10-years-older you be embarrassed you did?",
    placeholder: "The truth.",
  },
];

import { getStorageItem, setStorageItem } from "@/utils/storage";

export default function CreateCardWizard() {
  const router = useRouter();
  const posthog = usePostHog();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasExistingCard, setHasExistingCard] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Mandatory Auth Check + Existing Card Check
  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push("/login?returnTo=/create");
          return;
        }

        // Check if user already has a card
        const { data: card } = await supabase
          .from("cards")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (card) {
          setHasExistingCard(true);
        }
      } catch (e) {
        console.error("Auth check failed", e);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkUser();
  }, [router]);

  // Load from local storage
  useEffect(() => {
    const saved = getStorageItem("egoarena_progress");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAnswers(parsed.answers || {});
        setCurrentStep(parsed.step || 0);
      } catch (e) {
        console.error("Failed to parse progress", e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    if (currentStep < QUESTIONS.length) {
      setStorageItem(
        "egoarena_progress",
        JSON.stringify({ answers, step: currentStep })
      );
    }
  }, [answers, currentStep]);

  const handleNext = () => {
    if (currentStep < QUESTIONS.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleAnswer = (val: string) => {
    setAnswers((prev) => ({ ...prev, [QUESTIONS[currentStep].id]: val }));
    posthog?.capture("Question Answered", { question_id: QUESTIONS[currentStep].id });
    
    // Auto advance on MCQ
    if (QUESTIONS[currentStep].type === "mcq") {
      setTimeout(() => {
        handleNext();
      }, 300);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage("");
    posthog?.capture("Started Generating Card");
    
    try {
      const name = answers.name || "Anon";
      const payloadAnswers = { ...answers };
      delete payloadAnswers.name;

      const res = await fetch("/api/generate-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, answers: payloadAnswers }),
      });
      const data = await res.json();
      if (res.ok && data.card?.id) {
        localStorage.removeItem("egoarena_progress");
        localStorage.setItem("egoarena_card_id", data.card.id);
        posthog?.capture("Card Successfully Generated", { class: data.card.class, alignment: data.card.alignment });
        router.push(`/card/${data.card.id}`);
      } else {
        setErrorMessage(data.error || "An unknown error occurred.");
        setIsSubmitting(false);
      }
    } catch (err) {
      setErrorMessage("Failed to connect to the server.");
      setIsSubmitting(false);
    }
  };

  const q = QUESTIONS[currentStep];
  const progress = (currentStep / QUESTIONS.length) * 100;

  if (hasExistingCard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <Zap className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-3xl font-bold mb-4 text-white">Identity Detected</h2>
          <p className="text-white/50 mb-10 leading-relaxed">
            You have already forged an identity in the EgoArena. You cannot start over from zero—you can only evolve.
          </p>
          <div className="flex flex-col gap-4">
            <Link
              href="/reassess"
              className="px-8 py-4 bg-accent text-bg font-bold uppercase tracking-widest rounded-full hover:scale-105 transition-all shadow-[0_0_20px_rgba(94,167,160,0.3)]"
            >
              Begin Re-assessment
            </Link>
            <Link
              href="/me"
              className="text-white/30 hover:text-white transition-colors font-mono text-[10px] uppercase tracking-widest"
            >
              Return to Dashboard
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-white/50">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="font-mono text-[10px] uppercase tracking-widest">Checking Authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap relative min-h-screen flex flex-col !pt-[10vh]">
      {/* Header / Progress */}
      <div className="w-full mb-12">
        <div className="w-full h-1 bg-surface2 rounded overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-2 font-mono text-[10px] text-muted tracking-wide uppercase">
          <span>{currentStep === QUESTIONS.length ? "Final Step" : `Question ${currentStep + 1} of 10`}</span>
        </div>
      </div>

      {currentStep === QUESTIONS.length ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto w-full">
          {errorMessage ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full text-left bg-[#f4f1eb] shadow-2xl rounded p-8 md:p-14 relative"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent3 via-accent to-accent2" />
              
              <div className="mb-10 text-black">
                <h2 className="text-3xl font-serif text-[#1a1a1a] mb-2">
                  A note from the evaluator.
                </h2>
                <div className="w-12 h-px bg-[#1a1a1a] mb-8" />
                
                <div className="font-serif text-base md:text-lg leading-relaxed text-[#333] whitespace-pre-wrap italic">
                  "{errorMessage}"
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 items-center pt-8 border-t border-[#1a1a1a]/10">
                <button
                  onClick={() => {
                      setErrorMessage("");
                      setAnswers({}); 
                      setCurrentStep(0); 
                      localStorage.removeItem("egoarena_progress");
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-[#1a1a1a] text-[#f4f1eb] font-sans text-sm font-bold tracking-wide hover:bg-black transition-colors"
                >
                  I will take this seriously now.
                </button>
                <Link 
                  href="/" 
                  className="w-full sm:w-auto px-6 py-3 text-[#666] font-sans text-sm tracking-wide hover:text-black transition-colors text-center"
                >
                  Leave quietly.
                </Link>
              </div>
            </motion.div>
          ) : !isSubmitting ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-3xl font-sans font-bold mb-4">
                Ready to face the truth?
              </h2>
              <p className="text-muted mb-10 max-w-md mx-auto">
                Your answers will be analyzed by our AI to generate your unique
                character card and identify your fatal flaw.
              </p>

              <button
                onClick={handleSubmit}
                className="group inline-flex items-center gap-2 px-8 py-4 bg-accent text-bg font-sans font-bold uppercase tracking-wide rounded-sm hover:-translate-y-1 transition-all"
              >
                Generate My Card
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center text-accent">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="font-mono text-sm tracking-widest uppercase animate-pulse">
                Analyzing your psyche...
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1"
            >
              <h2 className="text-2xl font-sans font-bold mb-8">{q.prompt}</h2>

              {q.type === "mcq" ? (
                <div className="flex flex-col gap-3">
                  {q.options?.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(opt)}
                      className={`text-left p-4 rounded-lg border transition-all ${
                        answers[q.id] === opt
                          ? "border-accent bg-accent/10"
                          : "border-border-subtle bg-surface hover:border-border-strong hover:bg-surface2"
                      }`}
                    >
                      <span className="text-[0.95rem]">{opt}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <textarea
                    value={answers[q.id] || ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    placeholder={q.placeholder}
                    className="w-full min-h-[120px] p-4 rounded-lg border border-border-subtle bg-surface text-white placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none transition-all"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleNext}
                      disabled={!(answers[q.id] || "").trim()}
                      className="px-6 py-2 bg-surface2 border border-border-strong rounded hover:bg-white/5 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 pt-6 border-t border-border-subtle flex justify-between">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0 || isSubmitting}
              className="flex items-center gap-2 text-muted font-mono text-xs uppercase tracking-wider hover:text-white disabled:opacity-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
