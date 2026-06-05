// Script descartável: diagnostica as connection strings do Supabase.
// NUNCA imprime a senha — só metadados seguros (tamanho, se há char especial) e o resultado da conexão.
import "dotenv/config";
import pg from "pg";

function analyze(label, raw) {
  if (!raw) {
    console.log(`\n[${label}] não definido no .env`);
    return null;
  }
  // captura a senha entre o 1º ":" depois de "//user" e o ÚLTIMO "@"
  const m = raw.match(/^\w+:\/\/([^:@/]+):(.*)@([^@/]+?)(?::(\d+))?\/([^?]+)/);
  if (!m) {
    console.log(`\n[${label}] formato não reconhecido`);
    return raw;
  }
  const [, user, pass, host, port, db] = m;
  const special = [...new Set(pass.split("").filter((c) => !/[A-Za-z0-9]/.test(c)))];
  const hasPercent = pass.includes("%");
  console.log(`\n[${label}]`);
  console.log("  user :", user);
  console.log("  host :", host);
  console.log("  port :", port || "(padrão)");
  console.log("  db   :", db);
  console.log("  senha: tamanho", pass.length, "| chars especiais:", special.length ? special.join(" ") : "nenhum");
  if (special.length && !hasPercent) {
    console.log("  ⚠️  tem char especial e NÃO parece estar URL-encoded → provável causa do erro");
  }
  return raw;
}

async function tryConnect(label, url) {
  if (!url) return;
  const client = new pg.Client({ connectionString: url });
  try {
    await client.connect();
    const { rows } = await client.query("select current_user as u, current_database() as d");
    console.log(`  ✅ ${label} conectou (user=${rows[0].u}, db=${rows[0].d})`);
  } catch (e) {
    console.log(`  ❌ ${label} falhou: ${e.message}`);
  } finally {
    try { await client.end(); } catch {}
  }
}

const direct = analyze("DIRECT_URL", process.env.DIRECT_URL);
const pooled = analyze("DATABASE_URL", process.env.DATABASE_URL);
console.log("\n=== tentando conectar ===");
await tryConnect("DIRECT_URL", direct);
await tryConnect("DATABASE_URL", pooled);
