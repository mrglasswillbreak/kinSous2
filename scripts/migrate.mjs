import { neon } from "@neondatabase/serverless";
import { readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { migrationStatements } from "./migration-statements.mjs";
if (!process.env.DATABASE_URL)
  throw new Error("Set DATABASE_URL before running migrations");
const sql = neon(process.env.DATABASE_URL);
await sql`CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`;
for (const name of (await readdir("migrations"))
  .filter((n) => n.endsWith(".sql"))
  .sort()) {
  const content = await readFile(`migrations/${name}`, "utf8");
  const checksum = createHash("sha256").update(content).digest("hex");
  const existing =
    await sql`SELECT checksum FROM schema_migrations WHERE name=${name}`;
  if (existing.length) {
    if (existing[0].checksum !== checksum)
      throw new Error(`Migration changed: ${name}`);
    continue;
  }
  // Files use an explicit separator to preserve PL/pgSQL bodies.
  const statements = migrationStatements(content);
  await sql.transaction([
    ...statements.filter((s) => s.trim()).map((s) => sql.query(s)),
    sql`INSERT INTO schema_migrations(name,checksum) VALUES (${name},${checksum})`,
  ]);
  console.log(`Applied ${name}`);
}
