"use client";

import { useState } from "react";

export function MercadoLivreCallbackCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copyCallbackUrl() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
  }

  return (
    <div className="mt-5 rounded-xl border border-border bg-bg/60 p-4">
      <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
        Retorno temporario recebido
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={code}
          type="password"
          readOnly
          aria-label="Codigo temporario de autorizacao"
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm text-fg"
        />
        <button
          type="button"
          onClick={copyCallbackUrl}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
        >
          {copied ? "URL copiada" : "Copiar URL completa"}
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">
        Esta pagina nao armazena o codigo. A URL inclui o parametro de seguranca state e so pode ser utilizada no fluxo que a gerou.
      </p>
    </div>
  );
}
