import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { CurrencySettings } from "@/components/currency-settings";
import { addInstrument, addSetup, addTag } from "./actions";
import { getInstruments, getSetups, getTags } from "@/lib/data";
import { fmtNumber } from "@/lib/format";

const inputCls =
  "h-9 rounded-lg border border-border bg-surface-2 px-3 text-sm text-fg outline-none focus:border-accent";

export const dynamic = "force-dynamic";

export default async function ConfigPage() {
  const [instruments, setups, tags] = await Promise.all([
    getInstruments(),
    getSetups(),
    getTags(),
  ]);
  const emocoes = tags.filter((t) => t.tipo === "emocao");
  const erros = tags.filter((t) => t.tipo === "erro");

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight text-fg">Configurações</h1>
        <p className="text-xs text-muted">Instrumentos, tags, tema e backup.</p>
      </div>

      {/* Aparência */}
      <Card>
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>

      {/* Moeda */}
      <Card>
        <CardHeader>
          <CardTitle>Moeda e cotação</CardTitle>
        </CardHeader>
        <CardContent>
          <CurrencySettings />
        </CardContent>
      </Card>

      {/* Instrumentos */}
      <Card>
        <CardHeader>
          <CardTitle>Instrumentos</CardTitle>
          <span className="ml-auto text-xs text-muted">
            Valores por ponto/tick para cálculo automático
          </span>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="py-1.5 font-medium">Símbolo</th>
                <th className="py-1.5 font-medium">Nome</th>
                <th className="py-1.5 text-right font-medium">Tick</th>
                <th className="py-1.5 text-right font-medium">US$/tick</th>
                <th className="py-1.5 text-right font-medium">US$/ponto</th>
              </tr>
            </thead>
            <tbody>
              {instruments.map((i) => (
                <tr key={i.id} className="border-b border-border/50">
                  <td className="py-2 font-medium text-fg">{i.symbol}</td>
                  <td className="py-2 text-muted">{i.name}</td>
                  <td className="py-2 text-right tabular">{fmtNumber(i.tickSize, 2)}</td>
                  <td className="py-2 text-right tabular">US$ {fmtNumber(i.tickValue, 2)}</td>
                  <td className="py-2 text-right tabular">US$ {fmtNumber(i.pointValue, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <form action={addInstrument} className="mt-3 flex flex-wrap items-end gap-2">
            <input name="symbol" placeholder="Símbolo" className={`${inputCls} w-24`} required />
            <input name="name" placeholder="Nome" className={`${inputCls} flex-1 min-w-32`} />
            <input name="tickSize" placeholder="Tick" className={`${inputCls} w-20`} />
            <input name="tickValue" placeholder="US$/tick" className={`${inputCls} w-24`} />
            <input name="pointValue" placeholder="US$/ponto" className={`${inputCls} w-24`} />
            <Button type="submit" size="sm" variant="secondary">
              Adicionar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
          <span className="ml-auto text-xs text-muted">Setups e tags de emoção/erro</span>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-1.5 text-xs text-muted">Setups</div>
            <div className="flex flex-wrap gap-1.5">
              {setups.map((s) => (
                <Badge key={s.id} variant="accent">
                  {s.nome}
                </Badge>
              ))}
            </div>
            <form action={addSetup} className="mt-2 flex gap-2">
              <input name="nome" placeholder="Novo setup" className={`${inputCls} flex-1`} />
              <Button type="submit" size="sm" variant="secondary">
                + Setup
              </Button>
            </form>
          </div>

          <div>
            <div className="mb-1.5 text-xs text-muted">Emoção</div>
            <div className="flex flex-wrap gap-1.5">
              {emocoes.map((t) => (
                <Badge key={t.id} variant="neutral">
                  {t.nome}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-xs text-muted">Erros</div>
            <div className="flex flex-wrap gap-1.5">
              {erros.map((t) => (
                <Badge key={t.id} variant="warn">
                  {t.nome}
                </Badge>
              ))}
            </div>
            <form action={addTag} className="mt-2 flex gap-2">
              <input name="nome" placeholder="Nova tag" className={`${inputCls} flex-1`} />
              <select name="tipo" className={inputCls} defaultValue="emocao">
                <option value="emocao">Emoção</option>
                <option value="erro">Erro</option>
              </select>
              <Button type="submit" size="sm" variant="secondary">
                + Tag
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Backup */}
      <Card>
        <CardHeader>
          <CardTitle>Backup & exportação</CardTitle>
          <span className="ml-auto text-xs text-muted">Seus dados ficam locais (SQLite)</span>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" size="sm">
            <a href="/api/backup">Exportar tudo (.json)</a>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <a href="/api/export">Exportar trades (.csv)</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
