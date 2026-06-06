import Link from "next/link";
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DisciplineSlider } from "@/components/discipline-slider";
import { saveJournal } from "./actions";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { getAccounts, resolveAccount } from "@/lib/data";
import { CHECKLIST_ITEMS, parseChecklist } from "@/lib/journal";
import { fmtMoney, plColor } from "@/lib/format";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["S", "T", "Q", "Q", "S", "S", "D"];
const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export default async function DiarioPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string; conta?: string }>;
}) {
  const sp = await searchParams;
  const userId = await getUserId();
  const accounts = await getAccounts();
  const account = resolveAccount(accounts, sp.conta);
  const accountId = account?.id ?? null;

  const sel = sp.data ?? ymd(new Date());
  const selDate = new Date(`${sel}T12:00:00`);
  const year = selDate.getFullYear();
  const month = selDate.getMonth();

  const monthEntries = await prisma.journalEntry.findMany({
    where: {
      userId,
      accountId,
      data: { gte: startOfMonth(selDate), lte: endOfMonth(selDate) },
    },
  });
  const entryDays = new Set(monthEntries.map((e) => ymd(e.data)));

  const entry = await prisma.journalEntry.findFirst({
    where: { userId, accountId, data: new Date(`${sel}T12:00:00`) },
  });
  const checklist = parseChecklist(entry?.checklistJson ?? null);

  const dayTrades = accountId
    ? await prisma.trade.aggregate({
        where: {
          userId,
          accountId,
          dataHora: { gte: startOfDay(selDate), lte: endOfDay(selDate) },
        },
        _sum: { resultadoValor: true },
        _count: true,
      })
    : null;
  const dayPL = dayTrades?._sum.resultadoValor ?? 0;
  const dayCount = dayTrades?._count ?? 0;

  // calendário
  const daysInMonth = endOfMonth(selDate).getDate();
  const startOffset = (startOfMonth(selDate).getDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const contaQ = accountId ? `&conta=${accountId}` : "";

  const labelCls = "mb-1 block text-xs text-muted";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight text-fg">Diário</h1>
        <p className="text-xs text-muted">Plano, review e disciplina — dia a dia.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        {/* Calendário */}
        <Card>
          <CardHeader>
            <CardTitle className="capitalize">
              {selDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] text-muted">
              {WEEKDAYS.map((w, i) => (
                <div key={i}>{w}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, idx) => {
                if (day === null) return <div key={idx} />;
                const key = `${year}-${pad(month + 1)}-${pad(day)}`;
                const isSel = key === sel;
                const has = entryDays.has(key);
                return (
                  <Link
                    key={idx}
                    href={`/diario?data=${key}${contaQ}`}
                    className={cn(
                      "flex aspect-square flex-col items-center justify-center rounded-md text-xs transition-colors",
                      isSel
                        ? "bg-accent text-accent-fg"
                        : "bg-surface-2 text-fg hover:bg-surface-2/70",
                    )}
                  >
                    {day}
                    {has && !isSel && (
                      <span className="mt-0.5 h-1 w-1 rounded-full bg-accent" />
                    )}
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Formulário do dia */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>{selDate.toLocaleDateString("pt-BR")}</CardTitle>
              <p className="text-xs text-muted">{dayCount} trades</p>
            </div>
            <span className={cn("tabular text-sm font-semibold", plColor(dayPL))}>
              {fmtMoney(dayPL, { signed: true })}
            </span>
          </CardHeader>
          <CardContent>
            <form action={saveJournal} className="space-y-4">
              <input type="hidden" name="data" value={sel} />
              {accountId && <input type="hidden" name="accountId" value={accountId} />}

              <div>
                <label className={labelCls}>Plano pré-mercado</label>
                <textarea
                  name="planoPreMarket"
                  rows={2}
                  defaultValue={entry?.planoPreMarket ?? ""}
                  placeholder="Foco do dia, setups, metas..."
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className={labelCls}>Review pós-mercado</label>
                <textarea
                  name="reviewPosMarket"
                  rows={2}
                  defaultValue={entry?.reviewPosMarket ?? ""}
                  placeholder="O que funcionou, erros, o que melhorar..."
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none focus:border-accent"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Checklist de regras</label>
                  <div className="space-y-1.5">
                    {CHECKLIST_ITEMS.map((item, i) => (
                      <label key={i} className="flex items-center gap-2 text-sm text-fg">
                        <input
                          type="checkbox"
                          name={`chk_${i}`}
                          defaultChecked={checklist[i]}
                          className="h-4 w-4 accent-[var(--color-accent)]"
                        />
                        {item}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Nota de disciplina</label>
                  <DisciplineSlider initial={entry?.notaDisciplina ?? null} />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" size="sm">
                  Salvar entrada
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
