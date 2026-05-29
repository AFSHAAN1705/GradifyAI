"use client";

import { useState, useCallback, useRef } from "react";
import { Volume2, VolumeX, ChevronDown, ChevronUp } from "lucide-react";
import { useChatStore } from "./chat-store";

export function VoiceResponse({ text }: { text: string }) {
  const { isSpeaking, setSpeaking, speechRate, setSpeechRate } = useChatStore();
  const [isHover, setIsHover] = useState(false);
  const [showSpeed, setShowSpeed] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const cleanText = text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/#{1,6}\s/g, "")
      .replace(/---/g, ".")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText.slice(0, 3000));
    utterance.rate = speechRate;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.lang = "en-IN";

    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }, [text, isSpeaking, speechRate, setSpeaking]);

  const rates = [0.5, 0.75, 1, 1.25, 1.5];

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => { setIsHover(false); setShowSpeed(false); }}
    >
      <button
        onClick={speak}
        className={`rounded p-1 transition ${
          isSpeaking
            ? "text-[var(--primary)] bg-[var(--primary)]/10"
            : "text-[var(--muted)] hover:text-[var(--foreground)]"
        }`}
        title={isSpeaking ? "Stop speaking" : "Read aloud"}
      >
        {isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
      </button>
      {isHover && (
        <div className="absolute bottom-full left-0 mb-1 z-10">
          <button
            onClick={() => setShowSpeed(!showSpeed)}
            className="flex items-center gap-0.5 rounded bg-[var(--surface)] border border-[var(--border)] px-1.5 py-0.5 text-[9px] text-[var(--muted)] hover:text-[var(--foreground)] shadow-lg whitespace-nowrap"
          >
            {speechRate}x
            {showSpeed ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
          </button>
          {showSpeed && (
            <div className="mt-0.5 flex gap-0.5 rounded bg-[var(--surface)] border border-[var(--border)] p-1 shadow-lg">
              {rates.map((r) => (
                <button
                  key={r}
                  onClick={() => { setSpeechRate(r); setShowSpeed(false); }}
                  className={`rounded px-1.5 py-0.5 text-[9px] transition ${
                    speechRate === r
                      ? "bg-[var(--primary)]/20 text-[var(--primary)]"
                      : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]"
                  }`}
                >
                  {r}x
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
