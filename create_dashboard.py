import os
import json

dashboard_content = '''
"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Trash2,
  User,
  Users
} from "lucide-react";
import { useProtectedRoute } from "@/lib/use-protected-route";
import { useAuthStore } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type SavedPrediction = {
  id: string;
  rank: number;
  category: string;
  round: number;
  resultCount: number;
  date: string;
};

type ChatConversation = {
  id: string;
  question: string;
  responsePreview: string;
  date: string;
  fullResponse: string;
};

type SavedCollege = {
  id: string;
  name: string;
  city: string;
  branches: string[];
};

const mockPredictions: SavedPrediction[] = [
  {
    id: "pred-1",
    rank: 15000,
    category: "OBC",
    round: 1,
    resultCount: 42,
    date: "2025-01-15"
  },
  {
    id: "pred-2",
    rank: 25000,
    category: "SC",
    round: 2,
    resultCount: 38,
    date: "2025-01-10"
  },
  {
    id: "pred-3",
    rank: 35000,
    category: "General",
    round: 1,
    resultCount: 56,
    date: "2024-12-28"
  }
];

const mockConversations: ChatConversation[] = [
  {
    id: "conv-1",
    question: "What is the cutoff rank for computer science at NIT Delhi?",
    responsePreview:
      "The cutoff rank for Computer Science at NIT Delhi in 2024 was approximately 2,500 for the General category...",
    date: "2025-01-18",
    fullResponse:
      "The cutoff rank for Computer Science at NIT Delhi in 2024 was approximately 2,500 for the General category in Round 1. This can vary based on the number of applicants and seat availability. The cutoff tends to be higher for more popular programs like CS. You should also consider cutoffs from previous years as they provide valuable insights into trends."
  },
  {
    id: "conv-2",
    question: "Which colleges offer mechanical engineering in Delhi?",
    responsePreview: "Several prominent colleges in Delhi offer Mechanical Engineering programs...",
    date: "2025-01-12",
    fullResponse:
      "Several prominent colleges in Delhi offer Mechanical Engineering programs, including NIT Delhi, DTU, MSIT, and various private institutions. NIT Delhi is one of the top choices with strong placement records. DTU also has excellent infrastructure and faculty. The choice depends on your rank and preferences."
  },
  {
    id: "conv-3",
    question: "How do I choose between multiple colleges?",
    responsePreview: "When choosing between multiple colleges, consider factors like placement records...",
    date: "2025-01-05",
    fullResponse:
      "When choosing between multiple colleges, consider: 1) Placement records and average packages 2) Faculty quality 3) Campus infrastructure 4) Location and cost of living 5) Branch preferences 6) Peer groups and culture. Make a weighted list of priorities based on what matters most to you."
  }
];

const mockColleges: SavedCollege[] = [
  {
    id: "college-1",
    name: "National Institute of Technology Delhi",
    city: "Delhi",
    branches: ["Computer Science", "Electrical Engineering", "Mechanical Engineering"]
  },
  {
    id: "college-2",
    name: "Delhi Technological University",
    city: "Delhi",
    branches: ["Computer Science", "Electronics and Communication", "Civil Engineering"]
  },
  {
    id: "college-3",
    name: "Manipal Institute of Technology",
    city: "Bangalore",
    branches: ["Computer Science", "Information Technology", "Mechanical Engineering"]
  }
];

function ProfileSection({ user, isLoading }: { user: any; isLoading: boolean }) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex items-center gap-4 border-b border-[var(--border)]">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1">
            <Skeleton className="mb-2 h-6 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardHeader>
      </Card>
    );
  }

  const memberSinceDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary)]">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user?.name || "User"}</h2>
            <p className="text-sm text-[var(--muted)]">{user?.email}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Member since {memberSinceDate}</p>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

function PredictionsSection({
  predictions,
  loading
}: {
  predictions: SavedPrediction[];
  loading: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [items, setItems] = useState(predictions);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Saved Predictions</h3>
        </CardHeader>
        <CardContent>
          <Skeleton className="mb-3 h-12 w-full" />
          <Skeleton className="mb-3 h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setTimeout(() => {
      setItems(items.filter((item) => item.id !== id));
      setDeletingId(null);
    }, 300);
  };

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Saved Predictions ({items.length})</h3>
          {expanded ? <ChevronUp /> : <ChevronDown />}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent>
          {items.length === 0 ? (
            <p className="text-center text-[var(--muted)]">No saved predictions yet</p>
          ) : (
            <div className="space-y-3">
              {items.map((pred) => (
                <div
                  key={pred.id}
                  className={`flex items-center justify-between rounded-lg border border-[var(--border)] bg-[rgba(255,255,255,0.04)] p-4 transition-opacity ${
                    deletingId === pred.id ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-5 w-5 text-[var(--primary)]" />
                      <div>
                        <p className="font-medium">Rank: {pred.rank} | {pred.category}</p>
                        <p className="text-sm text-[var(--muted)]">
                          Round {pred.round} • {pred.resultCount} results • {pred.date}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(pred.id)}
                    disabled={deletingId === pred.id}
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function ChatHistorySection({
  conversations,
  loading
}: {
  conversations: ChatConversation[];
  loading: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const [selectedConv, setSelectedConv] = useState<ChatConversation | null>(null);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">AI Chat History</h3>
        </CardHeader>
        <CardContent>
          <Skeleton className="mb-3 h-12 w-full" />
          <Skeleton className="mb-3 h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">AI Chat History ({conversations.length})</h3>
            {expanded ? <ChevronUp /> : <ChevronDown />}
          </div>
        </CardHeader>

        {expanded && (
          <CardContent>
            {conversations.length === 0 ? (
              <p className="text-center text-[var(--muted)]">No conversations yet</p>
            ) : (
              <div className="space-y-3">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[rgba(255,255,255,0.04)] p-4 text-left transition-colors hover:bg-[rgba(255,255,255,0.08)]"
                  >
                    <div className="flex items-start gap-3">
                      <MessageSquare className="mt-1 h-4 w-4 flex-shrink-0 text-[var(--primary)]" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium line-clamp-1">{conv.question}</p>
                        <p className="mt-1 text-sm text-[var(--muted)] line-clamp-2">
                          {conv.responsePreview}
                        </p>
                        <p className="mt-2 text-xs text-[var(--muted)]">{conv.date}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {selectedConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-h-[80vh] w-full max-w-2xl overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Conversation Details</h3>
                  <p className="text-sm text-[var(--muted)]">{selectedConv.date}</p>
                </div>
                <button
                  onClick={() => setSelectedConv(null)}
                  className="text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  ✕
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Your Question:</h4>
                <p className="text-[var(--muted)]">{selectedConv.question}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">AI Response:</h4>
                <p className="text-[var(--muted)] leading-relaxed">{selectedConv.fullResponse}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function SavedCollegesSection({
  colleges,
  loading
}: {
  colleges: SavedCollege[];
  loading: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const [items, setItems] = useState(colleges);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Saved Colleges</h3>
        </CardHeader>
        <CardContent>
          <Skeleton className="mb-3 h-16 w-full" />
          <Skeleton className="mb-3 h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  const handleRemove = (id: string) => {
    setDeletingId(id);
    setTimeout(() => {
      setItems(items.filter((item) => item.id !== id));
      setDeletingId(null);
    }, 300);
  };

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Saved Colleges ({items.length})</h3>
          {expanded ? <ChevronUp /> : <ChevronDown />}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent>
          {items.length === 0 ? (
            <p className="text-center text-[var(--muted)]">No saved colleges yet</p>
          ) : (
            <div className="space-y-3">
              {items.map((college) => (
                <div
                  key={college.id}
                  className={`flex items-start justify-between rounded-lg border border-[var(--border)] bg-[rgba(255,255,255,0.04)] p-4 transition-opacity ${
                    deletingId === college.id ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 flex-shrink-0 text-[var(--primary)]" />
                      <div>
                        <p className="font-medium">{college.name}</p>
                        <p className="text-sm text-[var(--muted)]">{college.city}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {college.branches.map((branch) => (
                            <span
                              key={branch}
                              className="inline-block rounded bg-[var(--primary)]/20 px-2 py-1 text-xs text-[var(--primary)]"
                            >
                              {branch}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(college.id)}
                    disabled={deletingId === college.id}
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function QuickStatsSection({
  user,
  loading
}: {
  user: any;
  loading: boolean;
}) {
  const [stats] = useState({
    totalPredictions: mockPredictions.length,
    totalCollegesViewed: 24,
    totalAIInteractions: mockConversations.length,
    hoursSpent: Math.floor(Math.random() * 100) + 5
  });

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="mb-3 h-8 w-16" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    { label: "Predictions Generated", value: stats.totalPredictions, icon: BarChart3 },
    { label: "Colleges Viewed", value: stats.totalCollegesViewed, icon: Users },
    { label: "AI Interactions", value: stats.totalAIInteractions, icon: MessageSquare },
    { label: "Hours on Platform", value: stats.hoursSpent, icon: Calendar }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{item.value}</p>
                  <p className="text-sm text-[var(--muted)]">{item.label}</p>
                </div>
                <Icon className="h-8 w-8 text-[var(--primary)]/50" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const { user, isLoading } = useProtectedRoute();
  const authUser = useAuthStore((state) => state.user);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    setLoadingData(true);
    const timer = setTimeout(() => setLoadingData(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-[var(--muted)]">Welcome back! Here\'s your admission journey overview.</p>
        </div>

        <div className="mb-8">
          <ProfileSection user={authUser} isLoading={isLoading || loadingData} />
        </div>

        <div className="mb-8">
          <QuickStatsSection user={authUser} loading={isLoading || loadingData} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <PredictionsSection predictions={mockPredictions} loading={isLoading || loadingData} />
            <SavedCollegesSection colleges={mockColleges} loading={isLoading || loadingData} />
          </div>

          <div>
            <ChatHistorySection conversations={mockConversations} loading={isLoading || loadingData} />
          </div>
        </div>
      </div>
    </div>
  );
}
'''

# Create directory structure
dashboard_dir = "d:\\\\ValidatorAI\\\\frontend\\\\app\\\\dashboard"
os.makedirs(dashboard_dir, exist_ok=True)

# Write the file
with open(os.path.join(dashboard_dir, "page.tsx"), "w") as f:
    f.write(dashboard_content)

print(f"Dashboard page created at {dashboard_dir}/page.tsx")
print(f"File size: {len(dashboard_content)} bytes")
