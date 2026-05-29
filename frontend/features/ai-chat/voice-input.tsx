"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Mic, MicOff, Languages } from "lucide-react";
import { useChatStore } from "./chat-store";

type SpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionError) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEvent = {
  results: SpeechRecognitionResultList;
  resultIndex: number;
};

type SpeechRecognitionResultList = {
  length: number;
  item: (index: number) => SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
};

type SpeechRecognitionResult = {
  isFinal: boolean;
  length: number;
  item: (index: number) => SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
};

type SpeechRecognitionAlternative = {
  transcript: string;
  confidence: number;
};

type SpeechRecognitionError = {
  error: string;
  message: string;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

const LANGUAGES = [
  { label: "English", code: "en-IN" },
  { label: "हिन्दी (Hindi)", code: "hi-IN" },
  { label: "ಕನ್ನಡ (Kannada)", code: "kn-IN" },
];

export function VoiceInput({ onTranscript }: { onTranscript: (text: string) => void }) {
  const { isListening, setListening } = useChatStore();
  const [langIndex, setLangIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      useChatStore.getState().setVoiceSupported(true);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    setListening(false);
  }, [setListening]);

  const startListening = useCallback(() => {
    setError(null);
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setError("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = LANGUAGES[langIndex].code;

    let finalTranscript = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionError) => {
      console.error("[Voice] Error:", event.error, event.message);
      if (event.error === "not-allowed") {
        setError("Microphone permission denied. Please allow microphone access.");
      } else if (event.error === "no-speech") {
        setError("No speech detected. Please try again.");
      } else {
        setError(`Error: ${event.error}`);
      }
      stopListening();
    };

    recognition.onend = () => {
      if (isListening) {
        setTimeout(() => {
          try { recognition.start(); } catch { /* ignore */ }
        }, 100);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch (err) {
      setError("Failed to start speech recognition.");
    }
  }, [langIndex, isListening, setListening, stopListening]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const cycleLanguage = () => {
    setLangIndex((prev) => (prev + 1) % LANGUAGES.length);
  };

  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        onClick={cycleLanguage}
        className="rounded-lg p-1.5 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition"
        title={`Language: ${LANGUAGES[langIndex].label}`}
      >
        <Languages className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={toggleListening}
        className={`rounded-lg p-1.5 transition ${
          isListening
            ? "bg-[var(--danger)]/20 text-[var(--danger)] shadow-lg shadow-[var(--danger)]/30 animate-pulse"
            : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]"
        }`}
        title={isListening ? `Listening (${LANGUAGES[langIndex].label})` : "Voice input"}
      >
        {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
      </button>
      {error && (
        <span className="text-[9px] text-[var(--danger)] max-w-24 truncate">{error}</span>
      )}
    </div>
  );
}
