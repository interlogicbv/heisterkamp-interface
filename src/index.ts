import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, parse } from "node:path";
import { loadConfig, type Config } from "./config.ts";
import { jsonToXml } from "./jsonToXml.ts";
import { transformTrucks } from "./transform.ts";
import { fetchIdMap } from "./db.ts";

async function fetchAndConvert(config: Config): Promise<void> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (config.authorization) {
    headers.Authorization = config.authorization;
  }

  const response = await fetch(config.apiUrl, {
    headers,
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`API gaf status ${response.status} ${response.statusText}`);
  }

  let data: unknown = await response.json();
  if (config.dataPath) {
    data = extractPath(data, config.dataPath);
  }

  let itemElement = "item";
  if (config.activityCodes === "all" || config.activityCodes.length > 0) {
    let idMatch: { map: Map<string, unknown>; truckField: string } | undefined;
    if (config.db) {
      const map = await fetchIdMap(config.db);
      idMatch = { map, truckField: config.db.matchColumn };
      console.log(`[${new Date().toISOString()}] ${map.size} ids opgehaald uit de database`);
    }
    data = transformTrucks(data, config.activityCodes, idMatch);
    itemElement = "truck";
  }

  const xml = jsonToXml(data, config.rootElement, itemElement);

  const outputFile = timestampedPath(config.outputFile);
  await mkdir(dirname(outputFile), { recursive: true });
  await writeFile(outputFile, xml, "utf8");
  console.log(`[${new Date().toISOString()}] XML weggeschreven naar ${outputFile}`);
}

/** Voegt een timestamp toe vóór de extensie: output/trucks.xml -> output/trucks-2026-07-17T09-15-30.xml */
function timestampedPath(outputFile: string): string {
  const stamp = new Date().toISOString().slice(0, 19).replaceAll(":", "-");
  const { dir, name, ext } = parse(outputFile);
  return join(dir, `${name}-${stamp}${ext || ".xml"}`);
}

function extractPath(data: unknown, path: string): unknown {
  let current = data;
  for (const key of path.split(".")) {
    if (current === null || typeof current !== "object") {
      throw new Error(`JSON_DATA_PATH "${path}" niet gevonden in de response`);
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

async function runSafely(config: Config): Promise<void> {
  try {
    await fetchAndConvert(config);
  } catch (error) {
    // Eén mislukte call mag de volgende runs niet blokkeren
    console.error(`[${new Date().toISOString()}] Fout:`, error);
  }
}

async function main(): Promise<void> {
  const config = loadConfig();
  const once = process.argv.includes("--once");

  await runSafely(config);
  if (once) {
    return;
  }

  console.log(`Volgende run over ${config.intervalMs / 60_000} minuten. Stop met Ctrl+C.`);
  setInterval(() => void runSafely(config), config.intervalMs);
}

void main();
