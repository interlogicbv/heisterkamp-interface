export interface DbConfig {
  server: string;
  port: number;
  database: string;
  user: string;
  password: string;
  /** SELECT-query die de ids oplevert om trucks aan te matchen */
  query: string;
  /** Kolom in het queryresultaat met het id dat aan de XML toegevoegd wordt */
  idColumn: string;
  /** Kolom in het queryresultaat én veld van de truck waarop gematcht wordt, bijv. "truck_number" of "license_plate" */
  matchColumn: string;
}

export interface Config {
  /** URL waar de GET-request naartoe gaat */
  apiUrl: string;
  /** Interval tussen twee calls, in milliseconden */
  intervalMs: number;
  /** Pad van het XML-bestand dat weggeschreven wordt */
  outputFile: string;
  /** Naam van het root-element in de XML */
  rootElement: string;
  /** Optionele Authorization-header, bijv. "Bearer <token>" */
  authorization?: string;
  /** Optioneel pad (dot-notatie) naar het deel van de JSON dat omgezet wordt, bijv. "data" */
  dataPath?: string;
  /** Alleen trucks met een van deze activiteitscodes opnemen; "all" = alle trucks in compacte vorm; leeg = ruwe, ongefilterde output */
  activityCodes: number[] | "all";
  /** Optionele MSSQL-koppeling om ids op te halen en aan de trucks te matchen */
  db?: DbConfig;
}

function parseActivityCodes(raw: string | undefined): number[] | "all" {
  if (!raw?.trim()) {
    return [];
  }
  if (raw.trim() === "*") {
    return "all";
  }
  return raw.split(",").map((part) => {
    const code = Number(part.trim());
    if (!Number.isFinite(code)) {
      throw new Error(`ACTIVITY_CODES bevat een ongeldige code: "${part}"`);
    }
    return code;
  });
}

export function loadConfig(): Config {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL ontbreekt. Zet deze in .env (zie .env.example).");
  }

  const intervalMinutes = Number(process.env.INTERVAL_MINUTES ?? "5");
  if (!Number.isFinite(intervalMinutes) || intervalMinutes <= 0) {
    throw new Error(`INTERVAL_MINUTES is ongeldig: ${process.env.INTERVAL_MINUTES}`);
  }

  return {
    apiUrl,
    intervalMs: intervalMinutes * 60_000,
    outputFile: process.env.OUTPUT_FILE ?? "output/data.xml",
    rootElement: process.env.XML_ROOT_ELEMENT ?? "root",
    authorization: process.env.API_AUTHORIZATION,
    dataPath: process.env.JSON_DATA_PATH || undefined,
    activityCodes: parseActivityCodes(process.env.ACTIVITY_CODES),
    db: loadDbConfig(),
  };
}

function loadDbConfig(): DbConfig | undefined {
  if (!process.env.DB_SERVER) {
    return undefined;
  }

  const required = ["DB_DATABASE", "DB_USER", "DB_PASSWORD", "DB_QUERY"] as const;
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`DB_SERVER is gezet, maar deze variabelen ontbreken nog: ${missing.join(", ")}`);
  }

  return {
    server: process.env.DB_SERVER!,
    port: Number(process.env.DB_PORT ?? "1433"),
    database: process.env.DB_DATABASE!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    query: process.env.DB_QUERY!,
    idColumn: process.env.DB_ID_COLUMN ?? "id",
    matchColumn: process.env.DB_MATCH_COLUMN ?? "truck_number",
  };
}
