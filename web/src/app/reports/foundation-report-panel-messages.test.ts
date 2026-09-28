import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../../..");
const panelSource = fs.readFileSync(path.join(__dirname, "FoundationReportPanel.tsx"), "utf8");
const layoutSource = fs.readFileSync(path.join(__dirname, "layout.tsx"), "utf8");
const keys = [...new Set([...panelSource.matchAll(/\bt\("([A-Za-z]+)"/g)].map((match) => match[1]))];

describe("foundation report panel messages", () => {
  it("is used from a layout that sends the Reports namespace to the browser", () => {
    // Client components only see the namespaces a layout passes down; without
    // this the panel rendered raw keys such as "Reports.foundationHeading".
    expect(panelSource).toContain('useTranslations("Reports")');
    expect(layoutSource).toMatch(/namespaces=\{\[[^\]]*"Reports"/);
  });

  it.each(["id", "en", "ar"])("has every key the panel uses in %s", (locale) => {
    const messages = JSON.parse(fs.readFileSync(path.join(root, "messages", `${locale}.json`), "utf8"));
    expect(keys.length).toBeGreaterThan(10);
    for (const key of keys) {
      expect(messages.Reports?.[key], `${locale}.Reports.${key}`).toBeTypeOf("string");
    }
  });
});
