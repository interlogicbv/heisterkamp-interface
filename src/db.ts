import sql from "mssql";
import type { DbConfig } from "./config.ts";

/**
 * Voert de match-query uit en bouwt een map van matchwaarde -> id.
 * De query moet minimaal de kolommen uit DB_ID_COLUMN en DB_MATCH_COLUMN teruggeven.
 */
export async function fetchIdMap(db: DbConfig): Promise<Map<string, unknown>> {
  const pool = await sql.connect({
    server: db.server,
    port: db.port,
    database: db.database,
    user: db.user,
    password: db.password,
    options: {
      encrypt: false,
      trustServerCertificate: false,
    },
    connectionTimeout: 15_000,
    requestTimeout: 30_000,
  });

  try {
    const result = await pool.request().query(db.query);
    const map = new Map<string, unknown>();
    for (const row of result.recordset as Record<string, unknown>[]) {
      if (!(db.idColumn in row) || !(db.matchColumn in row)) {
        throw new Error(
          `DB_QUERY moet de kolommen "${db.idColumn}" en "${db.matchColumn}" teruggeven; ` +
            `kreeg: ${Object.keys(row).join(", ")}`,
        );
      }
      map.set(String(row[db.matchColumn]).trim(), row[db.idColumn]);
    }
    return map;
  } finally {
    await pool.close();
  }
}
