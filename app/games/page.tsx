"use client";

import { AppShell } from "@/frontend/components/layouts/AppShell";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Gamepad2, Play, Trophy, RefreshCw, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/frontend/store";

const GAME_TYPES = [
  { id: "WOULD_YOU_RATHER", label: "Would You Rather", emoji: "🤔", desc: "Choose between two fun options", color: "#d946ef" },
  { id: "COUPLES_QUIZ",     label: "Couples Quiz",     emoji: "💡", desc: "How well do you know each other?", color: "#3b82f6" },
  { id: "TRUTH_OR_DARE",    label: "Truth or Dare",    emoji: "🎭", desc: "Fun challenges for two", color: "#f59e0b" },
];

export default function GamesPage() {
  const { user } = useAuthStore();
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [myAnswer, setMyAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pastSessions, setPastSessions] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/games")
      .then((r) => r.json())
      .then((d) => { if (d.sessions) setPastSessions(d.sessions.slice(0, 5)); })
      .catch(console.error);
  }, []);

  async function startGame(gameType: string) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameType }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveSession(data.session);
        setCurrentRound(0);
        setMyAnswer("");
        setSubmitted(false);
      } else {
        toast.error(data.error || "Failed to start game");
      }
    } catch { toast.error("Something went wrong"); }
    finally { setIsLoading(false); }
  }

  function nextRound() {
    if (!activeSession) return;
    if (currentRound < activeSession.rounds.length - 1) {
      setCurrentRound(currentRound + 1);
      setMyAnswer("");
      setSubmitted(false);
    } else {
      toast.success("Game over! Great playing together 🎉");
      setActiveSession(null);
    }
  }

  const round = activeSession?.rounds?.[currentRound];
  const isWYR = activeSession?.gameType === "WOULD_YOU_RATHER";
  const isTOD = activeSession?.gameType === "TRUTH_OR_DARE";

  if (activeSession && round) {
    return (
      <AppShell>
        <div className="px-4 pt-6 pb-24 flex flex-col min-h-[80vh]" style={{ color: "rgb(var(--text))" }}>
          {/* Progress */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">{GAME_TYPES.find((g) => g.id === activeSession.gameType)?.emoji}</span>
              <span className="text-sm font-semibold">{GAME_TYPES.find((g) => g.id === activeSession.gameType)?.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>{currentRound + 1}/{activeSession.rounds.length}</span>
              <button onClick={() => setActiveSession(null)}><X size={20} style={{ color: "rgb(var(--text-muted))" }} /></button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 rounded-full mb-8 overflow-hidden" style={{ background: "rgb(var(--surface-muted))" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #d946ef, #e11d48)" }}
              animate={{ width: `${((currentRound + 1) / activeSession.rounds.length) * 100}%` }}
            />
          </div>

          {/* Question card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentRound}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="flex-1 flex flex-col"
            >
              <div className="card p-6 text-center mb-6 flex-1 flex flex-col justify-center">
                <p className="font-display font-bold text-xl leading-snug mb-2">{round.question}</p>
                {(round.optionA || round.optionB) && !submitted && (
                  <p className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>Choose your answer below</p>
                )}
              </div>

              {!submitted ? (
                <>
                  {isWYR || isTOD ? (
                    <div className="grid grid-cols-2 gap-3">
                      {[round.optionA, round.optionB].filter(Boolean).map((opt: string, idx: number) => (
                        <motion.button
                          key={opt}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => { setMyAnswer(opt); setSubmitted(true); }}
                          className="p-5 rounded-2xl font-semibold text-sm text-center"
                          style={{
                            background: idx === 0 ? "rgba(217,70,239,0.1)" : "rgba(225,29,72,0.1)",
                            border: `2px solid ${idx === 0 ? "#d946ef" : "#e11d48"}30`,
                            color: idx === 0 ? "#d946ef" : "#e11d48",
                          }}
                        >
                          {opt}
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        value={myAnswer}
                        onChange={(e) => setMyAnswer(e.target.value)}
                        className="input-field resize-none w-full"
                        rows={3}
                        placeholder="Your answer..."
                      />
                      <button
                        onClick={() => myAnswer.trim() && setSubmitted(true)}
                        disabled={!myAnswer.trim()}
                        className="btn-brand w-full justify-center py-3"
                      >
                        Submit Answer
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="card p-4 text-center">
                    <p className="text-sm font-semibold mb-1" style={{ color: "rgb(var(--text-muted))" }}>Your answer</p>
                    <p className="font-bold text-base" style={{ color: "#d946ef" }}>{myAnswer}</p>
                  </div>
                  <p className="text-center text-sm" style={{ color: "rgb(var(--text-muted))" }}>
                    Ask your partner and see if they match! 💜
                  </p>
                  <button onClick={nextRound} className="btn-brand w-full justify-center py-3">
                    {currentRound < activeSession.rounds.length - 1 ? (
                      <><ChevronRight size={16} /> Next Question</>
                    ) : (
                      <><Trophy size={16} /> Finish Game</>
                    )}
                  </button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-24 space-y-5" style={{ color: "rgb(var(--text))" }}>
        <div>
          <h1 className="font-display font-bold text-2xl">Couple Games</h1>
          <p className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>Play & discover each other</p>
        </div>

        {/* Game Selection */}
        <div className="space-y-3">
          {GAME_TYPES.map((game, i) => (
            <motion.button
              key={game.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => startGame(game.id)}
              disabled={isLoading}
              className="w-full card p-5 flex items-center gap-4 text-left"
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: `${game.color}15`, border: `1px solid ${game.color}25` }}>
                {game.emoji}
              </div>
              <div className="flex-1">
                <p className="font-bold" style={{ color: "rgb(var(--text))" }}>{game.label}</p>
                <p className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>{game.desc}</p>
              </div>
              <Play size={20} style={{ color: game.color, flexShrink: 0 }} />
            </motion.button>
          ))}
        </div>

        {/* Past Sessions */}
        {pastSessions.length > 0 && (
          <div>
            <h2 className="font-bold text-base mb-3 flex items-center gap-2">
              <Trophy size={18} style={{ color: "#f59e0b" }} />
              Recent Games
            </h2>
            <div className="space-y-2">
              {pastSessions.map((s) => {
                const gtype = GAME_TYPES.find((g) => g.id === s.gameType);
                return (
                  <div key={s.id} className="card p-3 flex items-center gap-3">
                    <span className="text-xl">{gtype?.emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{gtype?.label}</p>
                      <p className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>
                        {s.rounds.length} rounds · {new Date(s.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
