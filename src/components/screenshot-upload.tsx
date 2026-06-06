"use client";

import { useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "trade-screenshots";

// Upload do print do trade direto pro Supabase Storage, na pasta do próprio
// usuário ({userId}/...). A política de Storage garante isolamento por usuário.
// Guarda o caminho num input hidden; o servidor salva em trade.screenshotPath.
export function ScreenshotUpload({
  userId,
  name,
  initialPath,
  initialUrl,
}: {
  userId: string;
  name: string;
  initialPath?: string | null;
  initialUrl?: string | null;
}) {
  const [path, setPath] = useState(initialPath ?? "");
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const filePath = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, { upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      // Remove o print anterior (se havia) — best effort.
      const old = path;
      if (old && old !== filePath) {
        supabase.storage.from(BUCKET).remove([old]).catch(() => {});
      }
      setPath(filePath);
      setPreview(URL.createObjectURL(file));
    } catch {
      setError("Falha no upload. Use uma imagem (PNG/JPG/WEBP) de até 5 MB.");
    } finally {
      setUploading(false);
    }
  }

  function onRemove() {
    const old = path;
    if (old) {
      const supabase = createClient();
      supabase.storage.from(BUCKET).remove([old]).catch(() => {});
    }
    setPath("");
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <input type="hidden" name={name} value={path} />
      {preview ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Print do trade"
            className="max-h-56 rounded-lg border border-border"
          />
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remover print"
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-sm transition-colors hover:text-loss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-24 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface-2/40 text-sm text-muted transition-colors hover:border-accent hover:text-fg disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
          {uploading ? "Enviando…" : "Anexar print (imagem)"}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={onSelect}
        className="hidden"
      />
      {error && <p className="mt-1 text-xs text-loss">{error}</p>}
    </div>
  );
}
