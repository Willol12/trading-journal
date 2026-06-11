// Guia de consulta: a matemática por trás do simulador, com o caso Lucid 25k
// do usuário como exemplo. Conteúdo estático — números gerados pelo próprio
// motor (scripts/sim-guia.ts, seed 1, 10.000 runs, comissão $1,50/trade).

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-relaxed text-muted">
        {children}
      </CardContent>
    </Card>
  );
}

function T({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-xs">{children}</table>
    </div>
  );
}

const th = "border-b border-border px-2 py-1.5 text-left font-medium text-muted";
const td = "border-b border-border/50 px-2 py-1.5 text-fg";
const tdMut = "border-b border-border/50 px-2 py-1.5 text-muted";

export function Guia() {
  return (
    <div className="space-y-4">
      <Section title="1 · Os três gerenciamentos em números (MNQ, 1 contrato)">
        <p>
          No MNQ cada tick vale <strong className="text-fg">US$ 0,50</strong>{" "}
          (1 ponto = US$ 2). Os três ATMs comparados:
        </p>
        <T>
          <thead>
            <tr>
              <th className={th}>ATM</th>
              <th className={th}>Stop</th>
              <th className={th}>Alvo</th>
              <th className={th}>Risco</th>
              <th className={th}>Ganho</th>
              <th className={th}>R</th>
              <th className={th}>WR breakeven*</th>
              <th className={th}>&quot;Vidas&quot; no DD $1.000</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={td}>1x3</td>
              <td className={tdMut}>100t (25 pts)</td>
              <td className={tdMut}>300t (75 pts)</td>
              <td className={td}>$50</td>
              <td className={td}>$150</td>
              <td className={td}>3R</td>
              <td className={td}>25,8%</td>
              <td className={td}>20</td>
            </tr>
            <tr>
              <td className={td}>1x2</td>
              <td className={tdMut}>100t (25 pts)</td>
              <td className={tdMut}>200t (50 pts)</td>
              <td className={td}>$50</td>
              <td className={td}>$100</td>
              <td className={td}>2R</td>
              <td className={td}>34,3%</td>
              <td className={td}>20</td>
            </tr>
            <tr>
              <td className={td}>1x1</td>
              <td className={tdMut}>200t (50 pts)</td>
              <td className={tdMut}>200t (50 pts)</td>
              <td className={td}>$100</td>
              <td className={td}>$100</td>
              <td className={td}>1R</td>
              <td className={td}>50,8%</td>
              <td className={td}>10</td>
            </tr>
          </tbody>
        </T>
        <p className="text-xs">
          *WR breakeven = taxa de acerto mínima pra não perder dinheiro no longo
          prazo, já com comissão de $1,50 por trade: (risco + comissão) ÷ (risco +
          alvo). Sem comissão: 25% / 33,3% / 50%.
        </p>
        <p>
          Repare no detalhe que muda tudo: o 1x1 usa stop de{" "}
          <strong className="text-fg">200 ticks</strong>, então cada perda custa{" "}
          <strong className="text-fg">$100</strong> — você tem só{" "}
          <strong className="text-fg">10 vidas</strong> antes de estourar o
          drawdown, contra 20 vidas dos outros dois.
        </p>
      </Section>

      <Section title="2 · Numa avaliação, sobreviver importa mais que ser lucrativo">
        <p>
          Uma estratégia lucrativa pode reprovar numa mesa — e uma sem edge
          nenhum pode passar. O motivo é{" "}
          <strong className="text-fg">variância</strong>: a avaliação não mede
          sua expectância no longo prazo, mede se você atinge a meta{" "}
          <em>antes</em> de encostar num drawdown apertado. O que mata não é a
          média, é a <strong className="text-fg">sequência de perdas</strong> que
          acontece no caminho.
        </p>
        <p>
          Quanto menor o win rate, mais longas (e mais prováveis) as secas. Com
          35% de acerto, uma seca de 10+ perdas seguidas em ~60 trades não é
          azar: é o esperado. Por isso as duas alavancas que realmente aumentam a
          probabilidade de aprovação são: (a){" "}
          <strong className="text-fg">risco pequeno por trade</strong> em relação
          ao drawdown (mais vidas) e (b){" "}
          <strong className="text-fg">win rate folgado acima do breakeven</strong>{" "}
          do seu payoff. A tabela da seção 5 mostra isso em números.
        </p>
        <p className="text-xs">
          Vídeos de &quot;win rate alto sempre&quot; contam metade da história:
          baixar o payoff (1x1, 0.5R…) só ajuda se o win rate subir o
          suficiente pra compensar — e encurtar o alvo não garante isso quando o
          stop também muda. Compare cenários com números medidos, não com regra
          de bolso.
        </p>
      </Section>

      <Section title="3 · Como funciona o drawdown EOD trailing da Lucid">
        <p>
          O piso de eliminação começa em{" "}
          <strong className="text-fg">saldo inicial − $1.000</strong> (no 25k:
          $24.000). No <em>fim de cada dia</em>, se o saldo de fechamento fizer
          novo pico, o piso sobe junto (pico − $1.000) —{" "}
          <strong className="text-fg">até travar no saldo inicial</strong>{" "}
          ($25.000). Depois de acumular +$1.000, o piso para de subir: seu
          colchão volta a crescer a cada ganho.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            O piso só <em>anda</em> no fechamento do dia, mas{" "}
            <strong className="text-fg">tocar o piso vigente a qualquer
            momento elimina</strong> — inclusive no meio do dia.
          </li>
          <li>
            Operando 1 trade por dia, na prática o piso trila trade a trade até
            travar.
          </li>
          <li>
            A fase mais perigosa é o começo: ganhos iniciais sobem o piso e
            &quot;comem&quot; o colchão por trás. Ex.: dois dias de +$500 deixam
            o piso em $25.000 — um dia de −$1.000 a partir daí elimina, mesmo
            você estando no lucro acumulado.
          </li>
        </ul>
      </Section>

      <Section title="4 · Consistência 50% e mínimo de 2 dias">
        <p>
          Na aprovação, nenhum dia pode representar mais de 50% do lucro total.
          Operando 1x3 com 1 trade/dia, o melhor dia possível é ~$150 — a regra
          só morderia se o lucro total fosse menor que $300, impossível com meta
          de $1.250. <strong className="text-fg">Pra você, ela é inofensiva</strong>;
          ela morde quem faz um dia gigante (ex.: +$800 num dia = precisa
          fechar com ≥ $1.600 de lucro total pra aprovar, acima da meta).
        </p>
        <p>
          O mínimo de 2 dias operados também não pesa: com risco de $50 e alvo
          de $150, bater $1.250 exige no mínimo 9 dias de trade.
        </p>
      </Section>

      <Section title="5 · Tabela de referência — Lucid 25k, 1 trade/dia, até 120 dias">
        <p>
          Probabilidade de aprovação por win rate, simulada com 10.000 runs por
          célula (comissão $1,50/trade, regras reais: DD $1.000 EOD travado,
          consistência 50%, mín. 2 dias). &quot;Seca p95&quot; = maior sequência
          de perdas esperada (95º percentil).
        </p>
        <T>
          <thead>
            <tr>
              <th className={th}>Win rate</th>
              <th className={th}>1x3 aprova</th>
              <th className={th}>1x2 aprova</th>
              <th className={th}>1x1 aprova</th>
              <th className={th}>1x3 dias (med.)</th>
              <th className={th}>Seca p95 (1x3)</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["30%", "51,6%", "1,4%", "0,0%", "68", "16"],
              ["35%", "88,0%", "13,2%", "0,1%", "55", "13"],
              ["40%", "98,7%", "48,9%", "0,4%", "41", "11"],
              ["45%", "100%", "85,5%", "3,3%", "30", "9"],
              ["50%", "100%", "98,2%", "18,5%", "25", "7"],
              ["55%", "100%", "100%", "53,0%", "21", "6"],
              ["60%", "100%", "100%", "85,5%", "18", "5"],
              ["65%", "100%", "100%", "98,1%", "16", "5"],
              ["70%", "100%", "100%", "99,8%", "14", "4"],
            ].map((row) => (
              <tr key={row[0]}>
                {row.map((cell, i) => (
                  <td key={i} className={i === 0 ? td : tdMut}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </T>
        <p>Win rate necessário pra cada nível de segurança:</p>
        <T>
          <thead>
            <tr>
              <th className={th}>Aprovação alvo</th>
              <th className={th}>1x3</th>
              <th className={th}>1x2</th>
              <th className={th}>1x1</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={td}>50%</td>
              <td className={tdMut}>29,7%</td>
              <td className={tdMut}>40,0%</td>
              <td className={tdMut}>54,5%</td>
            </tr>
            <tr>
              <td className={td}>80%</td>
              <td className={td}>33,4%</td>
              <td className={td}>43,8%</td>
              <td className={td}>58,6%</td>
            </tr>
            <tr>
              <td className={td}>90%</td>
              <td className={tdMut}>35,4%</td>
              <td className={tdMut}>45,9%</td>
              <td className={tdMut}>60,8%</td>
            </tr>
          </tbody>
        </T>
      </Section>

      <Section title="6 · Então qual é o melhor pra mim?">
        <p>
          Os três exigem mais ou menos a mesma <em>folga sobre o próprio
          breakeven</em> (~8 pontos percentuais pra ~80% de aprovação). A
          diferença é <strong className="text-fg">qual pergunta cada um faz ao
          seu setup</strong>:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-fg">1x3</strong>: das suas entradas na OTE,
            o preço anda 75 pts antes de voltar 25? Se isso acontece em{" "}
            <strong className="text-fg">1 de cada 3 trades (≥ 33%)</strong>,
            você tem ≥ 80% de chance de passar.
          </li>
          <li>
            <strong className="text-fg">1x2</strong>: alvo mais perto = win rate
            naturalmente maior que no 1x3. Vale se encurtar o alvo elevar seu
            acerto pra ≥ 44%.
          </li>
          <li>
            <strong className="text-fg">1x1</strong>: stop 2× maior aguenta mais
            ruído (acerto sobe), mas cada erro queima 2 vidas — precisa de ≥ 59%
            de acerto. É o mais frágil dos três <em>nesta mesa</em>, a menos que
            o stop largo mude muito o seu acerto real.
          </li>
        </ul>
        <p>
          Não existe resposta universal: o melhor ATM é função do{" "}
          <strong className="text-fg">SEU win rate real em cada um</strong> — e
          isso se mede no diário, não se chuta. Registre 20–30 trades anotando
          até onde o preço foi (o MFE diz se o alvo de 3R era atingido), traga os
          números pro <em>Comparar gerenciamentos</em> e deixe o Monte Carlo
          decidir. Enquanto a amostra for pequena, ligue a opção{" "}
          <strong className="text-fg">incerteza no win rate (Bayes)</strong> pra
          ver o quanto ainda é incerto.
        </p>
      </Section>

      <Section title="7 · Limites do simulador (leia uma vez)">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            O modelo assume trades independentes com win rate estável. Mercado
            real tem regimes: semanas boas e ruins. O modo{" "}
            <em>bootstrap em blocos</em> preserva parte dessas sequências; o
            modo Bayes expõe a incerteza de amostras pequenas.
          </li>
          <li>
            &quot;Custo esperado&quot; assume tentativas independentes — se sua
            habilidade real está abaixo do breakeven, nenhuma quantidade de
            tentativas resolve.
          </li>
          <li>
            Probabilidade de aprovação <strong className="text-fg">não é
            promessa de lucro</strong>: passar a avaliação e ser lucrativo
            consistente são coisas diferentes.
          </li>
          <li>
            Regras de mesa mudam: confirme valores no site oficial antes de
            decidir (os presets daqui são sementes editáveis).
          </li>
        </ul>
      </Section>
    </div>
  );
}
