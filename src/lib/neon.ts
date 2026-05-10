interface NeonRow { [k: string]: unknown }

const endpoint = process.env.NEON_SQL_ENDPOINT;
const apiKey = process.env.NEON_SQL_API_KEY;

export async function neonQuery<T extends NeonRow = NeonRow>(query: string, params: unknown[] = []): Promise<T[]> {
  if (!endpoint || !apiKey) {
    throw new Error("Missing NEON_SQL_ENDPOINT or NEON_SQL_API_KEY environment variables");
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query, params }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Neon query failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return (data.rows ?? data) as T[];
}

export async function ensureAuthSchema() {
  await neonQuery(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await neonQuery(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}
