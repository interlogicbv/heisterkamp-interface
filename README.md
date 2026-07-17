# heisterkamp-interface

Node.js/TypeScript-programma dat periodiek (standaard elke 5 minuten) een GET-request naar een API doet en de JSON-response wegschrijft als XML-bestand.

## Vereisten

- Node.js 22 of hoger (draait TypeScript direct, zonder aparte compileerstap)

## Installatie

```bash
npm install
cp .env.example .env   # en vul minimaal API_URL in
```

## Configuratie (.env)

| Variabele           | Verplicht | Standaard         | Omschrijving                                                    |
| ------------------- | --------- | ----------------- | --------------------------------------------------------------- |
| `API_URL`           | ja        | –                 | URL waar de GET-request naartoe gaat                            |
| `API_AUTHORIZATION` | nee       | –                 | Waarde van de `Authorization`-header (de API-key)               |
| `INTERVAL_MINUTES`  | nee       | `5`               | Minuten tussen twee runs                                        |
| `OUTPUT_FILE`       | nee       | `output/data.xml` | Pad van het XML-bestand                                         |
| `XML_ROOT_ELEMENT`  | nee       | `root`            | Naam van het root-element in de XML                             |
| `JSON_DATA_PATH`    | nee       | –                 | Alleen dit deel van de response omzetten, bijv. `data`          |
| `ACTIVITY_CODES`    | nee       | –                 | Alleen trucks met deze activiteitscodes, bijv. `30,40`; `*` = alle trucks compact |

## Gebruik

```bash
npm start        # draait direct en daarna elke INTERVAL_MINUTES minuten
npm run once     # één enkele run (handig voor testen of een externe cron)
npm run dev      # zoals start, maar herstart automatisch bij codewijzigingen
```

Elke run schrijft een nieuw bestand met een timestamp in de naam, bijv. `output/trucks-2026-07-17T09-27-27.xml` (UTC). Een top-level JSON-array wordt omgezet naar `<item>`-elementen onder het root-element.

Met `ACTIVITY_CODES` gezet (bijv. `30,40` voor Laden/Lossen) worden alleen trucks met die huidige activiteit opgenomen, als `<truck>`-elementen met enkel de relevante velden: truck, kenteken, chauffeur, activiteit (code + omschrijving + tijdstip) en positie (lat/lng, plaats, tijdstip). Zonder `ACTIVITY_CODES` krijg je de volledige, ongefilterde response als XML.

## MSSQL-koppeling (optioneel)

Als `DB_SERVER` is ingevuld, wordt bij elke run eerst `DB_QUERY` op de database uitgevoerd. Het resultaat moet minimaal twee kolommen bevatten: `DB_ID_COLUMN` (standaard `id`) en `DB_MATCH_COLUMN` (standaard `truck_number`). Elke truck wordt via de match-kolom aan een rij gekoppeld; het bijbehorende id komt als `<id>`-element in de XML. Trucks zonder match krijgen geen `<id>`-element. Zie `.env.example` voor alle `DB_*`-variabelen. De verbinding gebruikt TLS (vereist voor Azure SQL).

## Ontwikkelen

```bash
npm run typecheck   # types controleren
npm run build       # compileren naar dist/ (optioneel; node dist/index.js)
```
