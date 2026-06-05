import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { CurrencyProvider } from "@/components/currency-provider";
import { getAccounts, getMetricTrades } from "@/lib/data";
import { mesaStatus } from "@/lib/metrics";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const jbmono = JetBrains_Mono({ variable: "--font-jbmono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Trading Journal",
  description: "Diário de trades e dashboard de performance",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const accounts = await getAccounts();
  const ativa = accounts.find((a) => a.ativa) ?? accounts[0];

  let footer;
  if (ativa) {
    const trades = await getMetricTrades(ativa.id);
    const st = mesaStatus(
      {
        saldoInicial: ativa.saldoInicial,
        metaProfit: ativa.metaProfit,
        limitePerdaDiario: ativa.limitePerdaDiario,
        maxDrawdown: ativa.maxDrawdown,
        tipoDrawdown: ativa.tipoDrawdown,
      },
      trades,
    );
    footer = {
      nome: ativa.nome,
      progressoMeta: st.progressoMeta,
      currentProfit: st.currentProfit,
      metaProfit: ativa.metaProfit,
    };
  }

  const topAccounts = accounts.map((a) => ({ id: a.id, nome: a.nome }));

  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${jbmono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('theme')==='light')document.documentElement.classList.add('light')}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full bg-bg text-fg">
        <CurrencyProvider>
        <div className="flex min-h-screen">
          <Suspense>
            <Sidebar footer={footer} />
          </Suspense>
          <div className="flex min-w-0 flex-1 flex-col">
            <Suspense>
              <Topbar accounts={topAccounts} />
            </Suspense>
            <main className="flex-1 p-4 md:p-6">{children}</main>
          </div>
        </div>
        </CurrencyProvider>
      </body>
    </html>
  );
}
