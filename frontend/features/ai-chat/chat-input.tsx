"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Send, Sparkles, StopCircle } from "lucide-react";
import { VoiceInput } from "./voice-input";
import { FileUpload } from "./file-upload";

const SUGGESTIONS = [
  "What colleges can I get with rank 25000?",
  "Compare DSCE CSE vs BIT ISE",
  "Best colleges in Bangalore for CSE",
  "Round 2 upgrade chances?",
  "Should I choose CSE or AIML?",
  "Build my option entry list",
];

export function ChatInput({
  onSend,
  disabled,
  isTyping,
  onStop,
}: {
  onSend: (message: string) => void;
  disabled: boolean;
  isTyping: boolean;
  onStop?: () => void;
}) {
  const [value, setValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [value]);

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.focus();
  }, []);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    setShowSuggestions(false);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setValue(suggestion);
    setShowSuggestions(false);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleVoiceTranscript = (transcript: string) => {
    setValue((prev) => prev + transcript);
    if (textareaRef.current) textareaRef.current.focus();
  };

  return (
    <div className="border-t border-[var(--border)] bg-[var(--surface)]">
      {/* Suggestions */}
      {showSuggestions && !value && (
        <div className="px-4 pt-3 pb-1.5">
          <div className="flex items-center gap-1 mb-2">
            <Sparkles className="h-3 w-3 text-[var(--accent)]" />
            <span className="text-[10px] font-medium text-[var(--muted)]">Suggested questions</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSuggestion(s)}
                className="rounded-lg border border-[var(--border)] px-2.5 py-1 text-[10px] text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition whitespace-nowrap"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 px-4 py-3">
        <div className="flex items-center gap-1">
          <FileUpload onSend={onSend} />
          <VoiceInput onTranscript={handleVoiceTranscript} />
        </div>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask SAM anything about KCET counselling..."
            rows={1}
            className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/30 transition pr-10"
            disabled={disabled}
          />
        </div>

        {isTyping ? (
          <button
            onClick={onStop}
            className="shrink-0 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/30 p-2.5 text-[var(--danger)] hover:bg-[var(--danger)]/20 transition"
            title="Stop generating"
          >
            <StopCircle className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!value.trim() || disabled}
            className="shrink-0 rounded-xl bg-[var(--primary)] p-2.5 text-white disabled:opacity-30 hover:bg-[var(--primary)]/80 transition disabled:cursor-not-allowed"
            title="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        )}
      </div>

      <p className="px-4 pb-2 text-[9px] text-[var(--muted)] text-center">
        SAM can make mistakes. Verify important information with official KEA sources.
      </p>
    </div>
  );
}
