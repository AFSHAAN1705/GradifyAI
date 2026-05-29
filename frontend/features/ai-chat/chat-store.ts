"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Message = {
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  metadata?: { provider?: string; sentiment?: string };
  context?: {
    rank?: number;
    category?: string;
    district?: string;
    branches?: string[];
  };
  summary?: string;
  showAnalysis?: boolean;
  fileInfo?: { name: string; type: string; size: number; path?: string };
};

export type Conversation = {
  _id: string;
  title: string;
  context?: {
    rank?: number;
    category?: string;
    district?: string;
    branches?: string[];
  };
  provider?: string;
  createdAt: string;
  updatedAt: string;
};

export type Recommendation = {
  college: string;
  code: string;
  branch: string;
  tier: string;
  cutoff: number;
  avgPackage: number;
  highestPackage: number;
  placementPct: number;
  confidence: number;
  tags: string[];
};

export type ComparisonCollege = {
  name: string;
  code: string;
  district: string;
  naacGrade: string;
  autonomous: boolean;
  avgPackage: number;
  highestPackage: number;
  placementPct: number;
  fee: number;
  nirfRank?: number;
  branches: string[];
};

type ChatState = {
  // Conversations
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];

  // User context (remembered across sessions)
  userContext: {
    rank: number | null;
    category: string;
    district: string;
    branches: string[];
  };

  // UI state
  isOpen: boolean;
  isFullPage: boolean;
  isTyping: boolean;
  provider: string | null;

  // Voice
  isListening: boolean;
  isSpeaking: boolean;
  speechRate: number;
  voiceSupported: boolean;

  // File upload
  uploadProgress: number;
  isUploading: boolean;

  // Recommendation cards
  recommendations: Recommendation[];

  // Comparison
  comparisonColleges: ComparisonCollege[];
  showComparison: boolean;

  // Analytics
  showAnalytics: boolean;

  // Strategy
  showStrategy: boolean;

  // Actions
  setOpen: (open: boolean) => void;
  setFullPage: (full: boolean) => void;
  setTyping: (typing: boolean) => void;
  setProvider: (provider: string | null) => void;
  setConversations: (conversations: Conversation[]) => void;
  setActiveConversation: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (index: number, updates: Partial<Message>) => void;
  updateUserContext: (ctx: Partial<ChatState["userContext"]>) => void;
  resetChat: () => void;

  // Voice actions
  setListening: (isListening: boolean) => void;
  setSpeaking: (isSpeaking: boolean) => void;
  setSpeechRate: (rate: number) => void;
  setVoiceSupported: (supported: boolean) => void;

  // Upload actions
  setUploadProgress: (progress: number) => void;
  setIsUploading: (uploading: boolean) => void;

  // Recommendation actions
  setRecommendations: (recs: Recommendation[]) => void;

  // Comparison actions
  setComparisonColleges: (colleges: ComparisonCollege[]) => void;
  setShowComparison: (show: boolean) => void;

  // Analytics actions
  setShowAnalytics: (show: boolean) => void;

  // Strategy actions
  setShowStrategy: (show: boolean) => void;
};

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      conversations: [],
      activeConversationId: null,
      messages: [],
      userContext: {
        rank: null,
        category: "GM",
        district: "",
        branches: [],
      },
      isOpen: false,
      isFullPage: false,
      isTyping: false,
      provider: null,

      // Voice state
      isListening: false,
      isSpeaking: false,
      speechRate: 1,
      voiceSupported: false,

      // Upload state
      uploadProgress: 0,
      isUploading: false,

      // Recommendations
      recommendations: [],

      // Comparison
      comparisonColleges: [],
      showComparison: false,

      // Analytics
      showAnalytics: false,

      // Strategy
      showStrategy: false,

      setOpen: (isOpen) => set({ isOpen }),
      setFullPage: (isFullPage) => set({ isFullPage }),
      setTyping: (isTyping) => set({ isTyping }),
      setProvider: (provider) => set({ provider }),
      setConversations: (conversations) => set({ conversations }),
      setActiveConversation: (activeConversationId) => set({ activeConversationId }),
      setMessages: (messages) => set({ messages }),
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
      updateMessage: (index, updates) =>
        set((state) => ({
          messages: state.messages.map((m, i) => (i === index ? { ...m, ...updates } : m)),
        })),
      updateUserContext: (ctx) =>
        set((state) => ({
          userContext: { ...state.userContext, ...ctx },
        })),
      resetChat: () => set({ messages: [], activeConversationId: null, provider: null }),

      // Voice
      setListening: (isListening) => set({ isListening }),
      setSpeaking: (isSpeaking) => set({ isSpeaking }),
      setSpeechRate: (speechRate) => set({ speechRate }),
      setVoiceSupported: (voiceSupported) => set({ voiceSupported }),

      // Upload
      setUploadProgress: (uploadProgress) => set({ uploadProgress }),
      setIsUploading: (isUploading) => set({ isUploading }),

      // Recommendations
      setRecommendations: (recommendations) => set({ recommendations }),

      // Comparison
      setComparisonColleges: (comparisonColleges) => set({ comparisonColleges }),
      setShowComparison: (showComparison) => set({ showComparison }),

      // Analytics
      setShowAnalytics: (showAnalytics) => set({ showAnalytics }),

      // Strategy
      setShowStrategy: (showStrategy) => set({ showStrategy }),
    }),
    {
      name: "gradifyai-sam-chat",
      partialize: (state) => ({
        userContext: state.userContext,
        conversations: state.conversations,
      }),
    }
  )
);
