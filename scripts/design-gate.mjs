import { chromium } from "playwright";
import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";

const browser = await chromium.launch();
const require = createRequire(import.meta.url);
const consoleErrors = [];
const axe = [];
const viewports = {
  "mobile-390": { width: 390, height: 844 },
  "tablet-768": { width: 768, height: 1024 },
  "desktop-1440": { width: 1440, height: 900 },
};
const report = {
  url: "http://localhost:3000",
  capturedAt: new Date().toISOString(),
  viewports: {},
  consoleErrors,
  axe,
  loadedFonts: [],
};

for (const [name, viewport] of Object.entries(viewports)) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push({ viewport: name, text: message.text() });
  });

  await page.goto(report.url, { waitUntil: "networkidle" });
  await page.screenshot({ path: `design-gate/${name}-fold.png`, fullPage: false });

  const horizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  report.viewports[name] = { horizontalScroll };

  await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
  const violations = await page.evaluate(async () => (await window.axe.run()).violations.map(({ id, impact, help }) => ({ id, impact, help })));
  axe.push(...violations.map((violation) => ({ viewport: name, ...violation })));

  if (name === "desktop-1440") {
    report.loadedFonts = await page.evaluate(() => performance.getEntriesByType("resource")
      .map((entry) => entry.name)
      .filter((url) => url.includes(".woff2")));
    await page.locator("article.property-card").first().hover();
    await page.waitForTimeout(450);
    await page.screenshot({ path: "design-gate/desktop-1440-hover.png", fullPage: false });
  }

  const scrollTarget = page.locator(name === "desktop-1440" ? ".feed" : ".main-stage");
  await scrollTarget.evaluate((element) => {
    const maximum = Math.max(0, element.scrollHeight - element.clientHeight);
    element.scrollTop = Math.round(maximum * .55);
  });
  await page.waitForFunction(() => [...document.querySelectorAll("article.property-card")]
    .filter((card) => {
      const rect = card.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight;
    })
    .every((card) => {
      const image = card.querySelector("img");
      return image?.complete && image.naturalWidth > 0;
    }), undefined, { timeout: 10000 }).catch(() => undefined);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `design-gate/${name}-full.png`, fullPage: false });

  await page.close();
}

await writeFile("design-gate/gate-report.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
await browser.close();

if (consoleErrors.length || axe.length || Object.values(report.viewports).some(({ horizontalScroll }) => horizontalScroll)) process.exit(1);
