"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Sparkles, GraduationCap } from "lucide-react";
import { ChatContainer } from "./chat-container";
import { useChatStore } from "./chat-store";

export function SamFloatingButton() {
  const { isOpen, setOpen } = useChatStore();

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--primary)] text-white shadow-lg shadow-[var(--accent)]/20 hover:shadow-xl hover:shadow-[var(--accent)]/30 transition-all duration-300"
          >
            <GraduationCap className="h-6 w-6" />
            {/* Notification dot */}
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--danger)] text-[9px] font-bold text-white shadow"
            >
              AI
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.93 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.93 }}
              transition={{ type: "spring", damping: 22, stiffness: 280 }}
              className="fixed bottom-6 right-6 z-50 flex h-[620px] w-[440px] flex-col overflow-hidden rounded-2xl border border-[var(--border)]/80 bg-[var(--background)]/95 backdrop-blur-2xl shadow-2xl shadow-black/20"
            >
              {/* Gradient border effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[var(--accent)]/5 to-transparent pointer-events-none" />

              {/* Close button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 z-10 rounded-lg p-1.5 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition"
              >
                <X className="h-4 w-4" />
              </motion.button>

              <ChatContainer />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function ChatPanel() {
  const { setOpen, setFullPage } = useChatStore();

  useEffect(() => {
    setFullPage(true);
    setOpen(true);
  }, []);

  return (
    <div className="flex h-[520px] w-full flex-col overflow-hidden rounded-xl border border-[var(--border)]/80 bg-[var(--background)]/95 backdrop-blur-2xl shadow-lg">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-[var(--accent)]/3 to-transparent pointer-events-none" />
      <ChatContainer />
    </div>
  );
}

export function ChatWindow() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border)]/80 bg-[var(--background)]/95 backdrop-blur-2xl shadow-2xl">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-[var(--accent)]/3 to-transparent pointer-events-none" />
      <ChatContainer />
    </div>
  );
}
