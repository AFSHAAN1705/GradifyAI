"use client";

import { useRef, useState } from "react";
import { Upload, FileText, Image, Video, X, Loader2, File as FileIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api/client";
import { useChatStore, type Message } from "./chat-store";

type UploadType = "file" | "image" | "video";

const UPLOAD_CONFIG: Record<UploadType, {
  accept: string;
  icon: typeof FileText;
  label: string;
  maxSize: string;
  endpoint: string;
  fieldName: string;
}> = {
  file: {
    accept: ".pdf,.docx,.txt",
    icon: FileText,
    label: "PDF, DOCX, TXT",
    maxSize: "50 MB",
    endpoint: "/api/ai/upload/file",
    fieldName: "file",
  },
  image: {
    accept: ".jpg,.jpeg,.png,.webp,.gif",
    icon: Image,
    label: "JPG, PNG, WEBP, GIF",
    maxSize: "50 MB",
    endpoint: "/api/ai/upload/image",
    fieldName: "image",
  },
  video: {
    accept: ".mp4,.mov,.avi",
    icon: Video,
    label: "MP4, MOV, AVI",
    maxSize: "50 MB",
    endpoint: "/api/ai/upload/video",
    fieldName: "video",
  },
};

export function FileUpload({ onSend }: { onSend: (text: string) => void }) {
  const { isUploading, setIsUploading, setUploadProgress } = useChatStore();
  const [showMenu, setShowMenu] = useState(false);
  const [uploadType, setUploadType] = useState<UploadType>("file");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = UPLOAD_CONFIG[uploadType];

  const handleUpload = async (file: File) => {
    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append(config.fieldName, file);

      if (useChatStore.getState().userContext.rank) {
        formData.append("rank", String(useChatStore.getState().userContext.rank));
      }
      if (useChatStore.getState().userContext.category) {
        formData.append("category", useChatStore.getState().userContext.category);
      }

      const result = await apiFetch<{
        conversationId: string;
        answer: string;
        provider: string;
        fileInfo: { name: string; type: string; size: number; path?: string };
      }>(config.endpoint, {
        method: "POST",
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      const userMsg: Message = {
        role: "USER",
        content: `Uploaded ${config.label}: **${file.name}**`,
        fileInfo: result.fileInfo,
      };
      useChatStore.getState().addMessage(userMsg);

      const assistantMsg: Message = {
        role: "ASSISTANT",
        content: result.answer,
        metadata: { provider: result.provider },
        fileInfo: result.fileInfo,
      };
      useChatStore.getState().addMessage(assistantMsg);
      useChatStore.getState().setActiveConversation(result.conversationId);

      setShowMenu(false);
      setPreviewUrl(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setError(msg);
      console.error("[Upload] Error:", msg);
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (uploadType === "image" && file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    }

    handleUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const triggerFileInput = (type: UploadType) => {
    setUploadType(type);
    setShowMenu(true);
    setTimeout(() => fileInputRef.current?.click(), 100);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isUploading}
        className="rounded-lg p-1.5 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition disabled:opacity-50"
        title="Upload file"
      >
        {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
      </button>

      <AnimatePresence>
        {showMenu && !isUploading && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute bottom-full left-0 mb-2 z-50"
          >
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-2xl backdrop-blur-xl min-w-[220px]">
              <p className="px-2 py-1 text-[10px] font-medium text-[var(--muted)]">Upload to SAM</p>
              <div className="space-y-0.5 mt-1">
                {Object.entries(UPLOAD_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => triggerFileInput(key as UploadType)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-[var(--foreground)] hover:bg-[var(--card-hover)] transition"
                  >
                    <cfg.icon className="h-3.5 w-3.5 text-[var(--muted)]" />
                    <span>{cfg.label}</span>
                    <span className="ml-auto text-[9px] text-[var(--muted)]">{cfg.maxSize}</span>
                  </button>
                ))}
              </div>
              <p className="px-2 pt-1.5 text-[8px] text-[var(--muted)] border-t border-[var(--border)] mt-1.5">
                SAM can read and analyze uploaded content
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isUploading && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-full left-0 mb-2 z-50 w-64"
        >
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--primary)]" />
              <span className="text-[11px] font-medium text-[var(--foreground)]">Uploading to SAM...</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "90%" }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"
              />
            </div>
            <p className="text-[9px] text-[var(--muted)] mt-1">Processing your file...</p>
          </div>
        </motion.div>
      )}

      {error && (
        <div className="absolute bottom-full left-0 mb-2 z-50 w-64">
          <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-2 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <X className="h-3 w-3 text-[var(--danger)]" />
              <span className="text-[10px] text-[var(--foreground)]">{error}</span>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={config.accept}
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
