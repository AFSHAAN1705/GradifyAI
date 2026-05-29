"use client";

import { create } from "zustand";
import { X, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { useEffect, useRef } from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
};

type ToastState = {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id"> & { type?: ToastType }) => void;
  dismiss: (id: string) => void;
};

const DURATIONS: Record<ToastType, number> = {
  success: 2000,
  info: 2500,
  error: 3000
};

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = crypto.randomUUID();
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id, type: toast.type ?? "success" }].slice(-5)
    }));
    const duration = DURATIONS[toast.type ?? "success"];
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, duration);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
}));

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4 text-[var(--success)]" />,
  info: <Info className="h-4 w-4 text-[var(--primary)]" />,
  error: <AlertTriangle className="h-4 w-4 text-[var(--danger)]" />
};

const BORDER_COLORS: Record<ToastType, string> = {
  success: "border-[rgba(67,244,182,0.3)]",
  info: "border-[rgba(101,228,255,0.3)]",
  error: "border-[rgba(255,107,122,0.3)]"
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const type = toast.type ?? "success";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const frame = requestAnimationFrame(() => {
      el.style.opacity = "1";
      el.style.transform = "translateX(0)";
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      ref={ref}
      className={`flex items-start gap-3 rounded-lg border ${BORDER_COLORS[type]} bg-[var(--surface)] p-4 shadow-lg transition-all duration-300`}
      style={{ opacity: 0, transform: "translateX(100%)" }}
    >
      <div className="mt-0.5 shrink-0">{ICONS[type]}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--foreground)]">{toast.title}</p>
        {toast.description ? (
          <p className="mt-0.5 text-sm text-[var(--muted)]">{toast.description}</p>
        ) : null}
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 rounded p-0.5 text-[var(--muted)] transition hover:text-[var(--foreground)]"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function ToastViewport() {
  const { toasts, dismiss } = useToastStore();

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] grid w-[min(380px,calc(100vw-32px))] gap-2.5">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
      ))}
    </div>
  );
}
