import { XMLBuilder } from "fast-xml-parser";

const builder = new XMLBuilder({
  format: true,
  indentBy: "  ",
  suppressEmptyNode: true,
});

/**
 * Zet een geparsed JSON-object om naar een XML-string.
 * Een top-level array wordt onder <itemElement>-elementen in de root geplaatst.
 */
export function jsonToXml(data: unknown, rootElement: string, itemElement = "item"): string {
  const content = Array.isArray(data) ? { [itemElement]: data } : data;
  const xmlBody = builder.build({ [rootElement]: content });
  return `<?xml version="1.0" encoding="UTF-8"?>\n${xmlBody}`;
}
