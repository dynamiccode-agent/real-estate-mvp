import { chromium } from "playwright";
import { createRequire } from "node:module";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
const require = createRequire(import.meta.url);
await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
const violations = await page.evaluate(async () => (await window.axe.run()).violations.map((violation) => ({
  id: violation.id,
  impact: violation.impact,
  help: violation.help,
  nodes: violation.nodes.map((node) => ({ target: node.target, html: node.html, failureSummary: node.failureSummary }))
})));
console.log(JSON.stringify(violations, null, 2));
await browser.close();
