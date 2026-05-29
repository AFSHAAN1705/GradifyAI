"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Bot, User, ThumbsUp, ThumbsDown, Copy, Check, Sparkles, ChevronDown, ChevronUp, FileText, Image } from "lucide-react";
import type { Message } from "./chat-store";
import { RankMeter, ProbabilityCard, TierDonut, PlacementMiniChart, RecommendationCards, StrategyCards } from "./visual-cards";
import { VoiceResponse } from "./voice-response";

function extractJsonFromContent(content: string): Record<string, unknown> | null {
  try {
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) return JSON.parse(jsonMatch[1]);
    return null;
  } catch { return null; }
}

function extractAndRemoveJson(content: string): { text: string; json: Record<string, unknown> | null } {
  const json = extractJsonFromContent(content);
  const text = content.replace(/```json[\s\S]*?```/g, "").trim();
  return { text, json };
}

function hasChartData(content: string): boolean {
  return content.includes("```json") || content.includes("rankMeter") || content.includes("successRate") || content.includes("tierDistribution");
}

function hasRecommendations(content: string): boolean {
  return content.includes("recommendation") || content.includes("collegeName") || content.includes("avgPackage");
}

function hasStrategyData(content: string): boolean {
  return content.includes("Round 1") || content.includes("Round 2") || content.includes("Extended Round");
}

// ─── Summary / Analysis Toggle ─────────────────────────────────────────────────

function SummaryAnalysis({ content, cleanContent }: { content: string; cleanContent: string }) {
  const [showAnalysis, setShowAnalysis] = useState(false);

  const sentences = cleanContent.split(/(?<=[.!?])\s+/).filter(Boolean);
  const summary = sentences.slice(0, 2).join(" ");
  const analysis = sentences.slice(2).join(" ");

  if (!analysis || sentences.length <= 3) return null;

  return (
    <div className="mt-2 pt-2 border-t border-[var(--border)]">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-medium text-[var(--muted)]">Quick Summary</span>
        <span className="text-[9px] text-[var(--muted)]">{summary.slice(0, 120)}...</span>
      </div>
      <button
        onClick={() => setShowAnalysis(!showAnalysis)}
        className="flex items-center gap-1 text-[9px] text-[var(--primary)] hover:text-[var(--accent)] transition"
      >
        {showAnalysis ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {showAnalysis ? "Hide detailed analysis" : "Show detailed analysis"}
      </button>
      {showAnalysis && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-1"
        >
          <ReactMarkdown
            components={{
              strong: ({ children }) => <strong className="font-semibold text-[var(--foreground)]">{children}</strong>,
              p: ({ children }) => <p className="mb-2 last:mb-0 text-[13px] leading-relaxed text-[var(--foreground)]">{children}</p>,
              ul: ({ children }) => <ul className="mb-2 space-y-1">{children}</ul>,
              li: ({ children }) => <li className="text-[13px] text-[var(--foreground)]">{children}</li>,
              h3: ({ children }) => <h3 className="text-sm font-semibold text-[var(--foreground)] mt-3 mb-1.5">{children}</h3>,
              hr: () => <div className="my-2 border-t border-[var(--border)]" />,
              code: ({ children }) => <code className="rounded bg-[var(--background)] px-1 py-0.5 text-[11px] font-mono text-[var(--primary)]">{children}</code>,
            }}
          >
            {analysis}
          </ReactMarkdown>
        </motion.div>
      )}
    </div>
  );
}

export function ChatMessage({ message, index }: { message: Message; index: number }) {
  const [liked, setLiked] = useState<"up" | "down" | null>(null);
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "USER";
  const isSystem = message.role === "SYSTEM";

  const { text: cleanContent, json } = extractAndRemoveJson(message.content);
  const hasCharts = hasChartData(message.content);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(cleanContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      <div className={`shrink-0 mt-0.5 ${isUser ? "ml-0" : ""}`}>
        {isUser ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/30">
            <User className="h-4 w-4 text-[var(--primary)]" />
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(188,140,255,0.12)] border border-[var(--accent)]/30">
            <Bot className="h-4 w-4 text-[var(--accent)]" />
          </div>
        )}
      </div>

      {/* Message */}
      <div className={`flex-1 max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--foreground)] rounded-tr-md"
              : isSystem
              ? "bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] text-xs italic"
              : "bg-[var(--surface)] border border-[var(--border)] rounded-tl-md"
          }`}
        >
          {/* File info badge */}
          {message.fileInfo && (
            <div className="flex items-center gap-1.5 mb-2 rounded-lg bg-[var(--background)] px-2 py-1.5 border border-[var(--border)]">
              {message.fileInfo.type === "image" || message.fileInfo.type?.startsWith("image") ? (
                <Image className="h-3.5 w-3.5 text-[var(--primary)]" />
              ) : (
                <FileText className="h-3.5 w-3.5 text-[var(--primary)]" />
              )}
              <span className="text-[10px] text-[var(--foreground)] truncate max-w-[120px]">{message.fileInfo.name}</span>
              {message.fileInfo.path && (
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${message.fileInfo.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[9px] text-[var(--primary)] hover:underline ml-auto shrink-0"
                >
                  View
                </a>
              )}
            </div>
          )}

          {/* Header */}
          {!isUser && message.metadata?.provider && (
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="h-3 w-3 text-[var(--accent)]" />
              <span className="text-[10px] font-medium text-[var(--accent)]">SAM</span>
              <span className="text-[9px] text-[var(--muted)]">
                {message.metadata.provider === "gemini" ? "via Gemini" : message.metadata.provider === "openai" ? "via OpenAI" : ""}
              </span>
            </div>
          )}

          {/* Content */}
          {isUser ? (
            <p className="text-sm">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none prose-invert">
              <ReactMarkdown
                components={{
                  strong: ({ children }) => <strong className="font-semibold text-[var(--foreground)]">{children}</strong>,
                  p: ({ children }) => <p className="mb-2 last:mb-0 text-[13px] leading-relaxed text-[var(--foreground)]">{children}</p>,
                  ul: ({ children }) => <ul className="mb-2 space-y-1">{children}</ul>,
                  li: ({ children }) => <li className="text-[13px] text-[var(--foreground)]">{children}</li>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold text-[var(--foreground)] mt-3 mb-1.5">{children}</h3>,
                  hr: () => <div className="my-2 border-t border-[var(--border)]" />,
                  code: ({ children }) => <code className="rounded bg-[var(--background)] px-1 py-0.5 text-[11px] font-mono text-[var(--primary)]">{children}</code>,
                }}
              >
                {cleanContent}
              </ReactMarkdown>
            </div>
          )}

          {/* Summary / Analysis toggle */}
          {!isUser && !isSystem && cleanContent.length > 200 && (
            <SummaryAnalysis content={message.content} cleanContent={cleanContent} />
          )}

          {/* Visual cards from embedded JSON */}
          {hasCharts && json && (
            <div className="mt-2 space-y-2">
              {json.rank && <RankMeter rank={json.rank as number} />}
              {json.successRate != null && (
                <ProbabilityCard successRate={json.successRate as number} total={(json.totalMatches as number) || 0} />
              )}
              {json.tierDistribution && <TierDonut distribution={json.tierDistribution as Record<string, number>} />}
              {json.placements && <PlacementMiniChart data={json.placements as Array<{ name: string; avgPackage: number; highestPackage: number }>} />}
            </div>
          )}
        </div>

        {/* Actions row */}
        {!isUser && !isSystem && (
          <div className="flex items-center gap-1 mt-1 ml-1">
            <VoiceResponse text={cleanContent} />
            <button onClick={() => setLiked(liked === "up" ? null : "up")} className={`rounded p-1 transition ${liked === "up" ? "text-[var(--primary)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}>
              <ThumbsUp className="h-3 w-3" />
            </button>
            <button onClick={() => setLiked(liked === "down" ? null : "down")} className={`rounded p-1 transition ${liked === "down" ? "text-[var(--danger)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}>
              <ThumbsDown className="h-3 w-3" />
            </button>
            <button onClick={handleCopy} className="rounded p-1 text-[var(--muted)] hover:text-[var(--foreground)] transition">
              {copied ? <Check className="h-3 w-3 text-[var(--success)]" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
