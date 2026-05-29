"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, MessageSquare, Trash2, Sparkles, GraduationCap, Zap, WifiOff, BarChart3, GitCompare, Target, FileText } from "lucide-react";
import { useChatStore, type Message } from "./chat-store";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ActionButtons } from "./visual-cards";
import { AnalyticsDashboard } from "./analytics-dashboard";
import { apiFetch } from "@/lib/api/client";

type HealthStatus = {
  provider: string;
  status: string;
  model: string;
  geminiConfigured: boolean;
};

const TYPING_MESSAGES = [
  "SAM is thinking...",
  "Analyzing cutoffs...",
  "Checking placement data...",
  "Generating strategy...",
  "Consulting college database...",
  "Preparing recommendation...",
  "Evaluating options...",
  "Crunching numbers...",
];

export function ChatContainer() {
  const store = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [typingText, setTypingText] = useState(TYPING_MESSAGES[0]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [thinkingProgress, setThinkingProgress] = useState(0);

  useEffect(() => {
    console.log("[Health] Checking backend connection...");
    apiFetch<HealthStatus>("/api/ai/health")
      .then((h) => {
        console.log(`[Health] 🟢 Backend Connected`, h);
        console.log(`[Health] Gemini API Key Loaded: ${h.geminiConfigured}`);
        console.log(`[Health] AI Provider: ${h.provider}`);
        console.log(`[Health] Gemini Model: ${h.model}`);
        setHealth(h);
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[Health] 🔴 Backend Disconnected: ${msg}`);
        setHealth(null);
      });
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [store.messages, store.isTyping, scrollToBottom]);

  // Enhanced typing animation with progress
  useEffect(() => {
    if (!store.isTyping) {
      setThinkingProgress(0);
      return;
    }
    let i = 0;
    const msgInterval = setInterval(() => {
      i = (i + 1) % TYPING_MESSAGES.length;
      setTypingText(TYPING_MESSAGES[i]);
    }, 2500);

    const progressInterval = setInterval(() => {
      setThinkingProgress((prev) => {
        const increment = Math.random() * 15;
        const next = Math.min(prev + increment, 90);
        return next;
      });
    }, 800);

    return () => {
      clearInterval(msgInterval);
      clearInterval(progressInterval);
    };
  }, [store.isTyping]);

  function buildContextPayload() {
    const ctx: Record<string, unknown> = {};
    if (store.userContext.rank) ctx.rank = store.userContext.rank;
    if (store.userContext.category) ctx.category = store.userContext.category;
    if (store.userContext.district) ctx.district = store.userContext.district;
    if (store.userContext.branches.length > 0) ctx.branches = store.userContext.branches;
    return ctx;
  }

  const sendMessage = async (text: string) => {
    const contextPayload = buildContextPayload();
    const userMsg: Message = {
      role: "USER",
      content: text,
      context: Object.keys(contextPayload).length > 0 ? contextPayload as Message["context"] : undefined,
    };
    store.addMessage(userMsg);
    store.setTyping(true);

    try {
      const result = await apiFetch<{
        conversationId: string;
        answer: string;
        provider: string;
        context: { rank?: number; category?: string; district?: string; branches?: string[] };
        sentiment?: string;
      }>("/api/ai/chat", {
        method: "POST",
        data: {
          ...(store.activeConversationId ? { conversationId: store.activeConversationId } : {}),
          message: text,
          context: Object.keys(contextPayload).length > 0 ? contextPayload : undefined,
        },
      });

      setThinkingProgress(100);

      const assistantMsg: Message = {
        role: "ASSISTANT",
        content: result.answer,
        metadata: { provider: result.provider, sentiment: result.sentiment },
      };
      store.addMessage(assistantMsg);
      store.setActiveConversation(result.conversationId);
      store.setProvider(result.provider);

      if (result.context) {
        store.updateUserContext({
          rank: result.context.rank ?? store.userContext.rank,
          category: result.context.category || store.userContext.category,
          district: result.context.district || store.userContext.district,
          branches: result.context.branches || store.userContext.branches,
        });
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("[Chat] Error:", errMsg);
      const isConnectionError = !health || errMsg.includes("Network Error") || errMsg.includes("connect") || errMsg.includes("ECONNREFUSED");
      const errorContent = isConnectionError
        ? "**Connection Error**\n\nMake sure the backend server is running on port 5000.\n\n> " + errMsg
        : "**Request Error**\n\nThe server responded with an error:\n\n> " + errMsg;
      store.addMessage({ role: "ASSISTANT", content: errorContent });
    } finally {
      store.setTyping(false);
    }
  };

  const handleAction = async (actionId: string) => {
    const rank = store.userContext.rank;
    const category = store.userContext.category;
    const prompts: Record<string, string> = {
      compare: "Compare top engineering colleges for my profile. Give me placement data, cutoff trends, and recommendations.",
      strategy: rank ? `Generate a complete admission strategy for rank ${rank}${category ? ` (${category})` : ""}. Include dream, competitive, moderate, and safe choices with placement data and reasoning.` : "Set my rank first, then I'll generate a strategy.",
      best: rank ? `What are the best colleges I can get with KCET rank ${rank}${category ? ` under ${category}` : ""}? Show me dream, moderate, and safe options with placement data.` : "Please share your KCET rank so I can recommend the best colleges for you.",
      upgrade: rank ? `What are my Round 2 upgrade chances with rank ${rank}${category ? ` (${category})` : ""}? Analyze cutoff movement from Round 1 to Round 2.` : "I need your rank to analyze upgrade chances. What's your KCET rank?",
      placement: "Analyze placement trends across colleges matching my profile. Compare average packages, top recruiters, and placement percentages.",
      branch: "Compare CSE, ISE, ECE, and AIML branches. Explain future scope, placements, demand trends, and which is best for different career goals.",
      "option-list": rank ? `Build a detailed option entry list for rank ${rank}${category ? ` (${category})` : ""}. Include college codes, round-wise strategy, and backup options.` : "Please share your KCET rank so I can build an option entry list.",
    };
    await sendMessage(prompts[actionId] || "Help me with KCET counselling.");
  };

  const newChat = () => store.resetChat();
  const deleteChat = async () => {
    if (store.activeConversationId) {
      try { await apiFetch(`/api/ai/chat/${store.activeConversationId}`, { method: "DELETE" }); } catch { /* ignore */ }
    }
    store.resetChat();
  };

  const aiOnline = health?.status === "online";

  return (
    <div className="flex h-full flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-xl px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-[var(--accent)]" />
          <span className="text-sm font-bold text-[var(--foreground)]">SAM</span>
          <span className="rounded bg-[rgba(188,140,255,0.1)] px-1.5 py-0.5 text-[9px] font-medium text-[var(--accent)]">AI Counsellor</span>
          {/* Status badge */}
          {health && (
            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium ${
              aiOnline
                ? "bg-[rgba(63,185,80,0.12)] text-[var(--success)] border border-[rgba(63,185,80,0.25)]"
                : "bg-[rgba(248,81,73,0.1)] text-[var(--danger)] border border-[rgba(248,81,73,0.2)]"
            }`}>
              {aiOnline ? <Zap className="h-2.5 w-2.5" /> : <WifiOff className="h-2.5 w-2.5" />}
              {aiOnline ? `AI Online` : `AI Offline`}
            </span>
          )}
          {aiOnline && health?.model && (
            <span className="hidden sm:inline text-[8px] text-[var(--muted)] tracking-tight">
              {health.model}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Analytics toggle */}
          {store.messages.filter((m) => m.role === "ASSISTANT").length > 0 && (
            <button
              onClick={() => store.setShowAnalytics(!store.showAnalytics)}
              className={`rounded-lg p-1.5 transition ${
                store.showAnalytics
                  ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]"
              }`}
              title="Analytics dashboard"
            >
              <BarChart3 className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={newChat} className="rounded-lg p-1.5 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition" title="New chat">
            <MessageSquare className="h-3.5 w-3.5" />
          </button>
          {store.messages.length > 0 && (
            <button onClick={deleteChat} className="rounded-lg p-1.5 text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[rgba(248,81,73,0.1)] transition" title="Delete chat">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Analytics Dashboard (collapsible) */}
      <AnalyticsDashboard />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
        {store.messages.length === 0 && !store.isTyping && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(188,140,255,0.12)] border border-[var(--accent)]/20 mb-4">
              <Bot className="h-7 w-7 text-[var(--accent)]" />
            </div>
            <h2 className="text-lg font-bold text-[var(--foreground)] mb-1">Hello, I&apos;m SAM</h2>
            <p className="text-xs text-[var(--muted)] max-w-sm mb-4">
              Your AI-powered KCET admission counsellor. I can help with college recommendations, branch comparisons, strategy planning, and more.
            </p>
            {store.userContext.rank && (
              <div className="flex items-center gap-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] px-3 py-2 text-xs mb-4">
                <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
                <span className="text-[var(--muted)]">I remember your rank: <strong className="text-[var(--foreground)]">{store.userContext.rank.toLocaleString()}</strong></span>
              </div>
            )}
            <ActionButtons onAction={handleAction} />
          </motion.div>
        )}

        {store.messages.map((msg, i) => (
          <ChatMessage key={`${msg.role}-${i}`} message={msg} index={i} />
        ))}

        {/* Enhanced thinking indicator */}
        <AnimatePresence>
          {store.isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex gap-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(188,140,255,0.12)] border border-[var(--accent)]/30">
                <Bot className="h-4 w-4 text-[var(--accent)]" />
              </div>
              <div className="rounded-2xl rounded-tl-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3 min-w-[200px]">
                {/* Typing dots + message */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-xs text-[var(--muted)]">{typingText}</span>
                </div>
                {/* Progress bar */}
                <div className="h-1 rounded-full bg-[var(--border)] overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: `${thinkingProgress}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"
                  />
                </div>
                {/* Thinking stage indicators */}
                <div className="flex items-center gap-2 mt-2">
                  {["Context", "Data", "Analysis"].map((stage, idx) => (
                    <span
                      key={stage}
                      className={`text-[8px] px-1.5 py-0.5 rounded-full transition ${
                        thinkingProgress > idx * 30
                          ? "bg-[var(--primary)]/20 text-[var(--primary)]"
                          : "bg-[var(--border)]/50 text-[var(--muted)]"
                      }`}
                    >
                      {stage}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSend={sendMessage} disabled={store.isTyping} isTyping={store.isTyping} />
    </div>
  );
}
