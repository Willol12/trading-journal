-- CreateTable
CREATE TABLE "Instrument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tickSize" REAL NOT NULL,
    "tickValue" REAL NOT NULL,
    "pointValue" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "firm" TEXT,
    "tamanho" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'eval',
    "saldoInicial" REAL NOT NULL DEFAULT 0,
    "moeda" TEXT NOT NULL DEFAULT 'USD',
    "metaProfit" REAL,
    "limitePerdaDiario" REAL,
    "maxDrawdown" REAL,
    "tipoDrawdown" TEXT NOT NULL DEFAULT 'trailing',
    "consistenciaPct" REAL,
    "minDiasTrade" INTEGER,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Setup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "dataHora" DATETIME NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "direcao" TEXT NOT NULL,
    "contratos" INTEGER NOT NULL DEFAULT 1,
    "precoEntrada" REAL,
    "precoSaida" REAL,
    "resultadoPontos" REAL,
    "resultadoValor" REAL NOT NULL,
    "comissoes" REAL NOT NULL DEFAULT 0,
    "riscoValor" REAL,
    "rrPlanejado" REAL,
    "rrRealizado" REAL,
    "resultado" TEXT NOT NULL,
    "setupId" TEXT,
    "screenshotPath" TEXT,
    "notas" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Trade_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Trade_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Trade_setupId_fkey" FOREIGN KEY ("setupId") REFERENCES "Setup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TradeTag" (
    "tradeId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    PRIMARY KEY ("tradeId", "tagId"),
    CONSTRAINT "TradeTag_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TradeTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" DATETIME NOT NULL,
    "accountId" TEXT,
    "planoPreMarket" TEXT,
    "reviewPosMarket" TEXT,
    "notaDisciplina" INTEGER,
    "checklistJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JournalEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Instrument_symbol_key" ON "Instrument"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "Setup_nome_key" ON "Setup"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_nome_tipo_key" ON "Tag"("nome", "tipo");

-- CreateIndex
CREATE INDEX "Trade_accountId_dataHora_idx" ON "Trade"("accountId", "dataHora");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_data_accountId_key" ON "JournalEntry"("data", "accountId");
