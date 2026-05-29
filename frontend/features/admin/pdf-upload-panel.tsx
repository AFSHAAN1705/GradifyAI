"use client";

import { Upload } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToastStore } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api/client";

export function PdfUploadPanel() {
  const toast = useToastStore((state) => state.push);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;

    setLoading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const result = await apiFetch<{ imported: number; skipped: number }>("/api/admin/upload-pdf", {
        method: "POST",
        data: form,
        headers: { "content-type": "multipart/form-data" }
      });
      toast({
        title: "PDF imported",
        description: `${result.imported} cutoff rows inserted or updated.`,
        type: "success"
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Admin JWT access is required.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">PDF Upload</h2>
        <p className="text-sm text-[var(--muted)]">Admin import for KCET cutoff PDFs</p>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3" onSubmit={submit}>
          <Input
            type="file"
            accept="application/pdf"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <Button type="submit" disabled={!file || loading}>
            <Upload className="h-4 w-4" />
            {loading ? "Uploading..." : "Upload PDF"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
