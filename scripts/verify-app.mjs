import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const checks = [];

async function check(label, assertion) {
  try {
    await assertion();
    checks.push({ label, status: "PASS" });
  } catch (error) {
    checks.push({ label, status: "FAIL", error: error.message });
  }
}

await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

await check("home feed loads from the app API", async () => {
  await page.getByRole("heading", { name: "Find a home that fits." }).waitFor();
  if (await page.locator("article.property-card").count() < 4) throw new Error("Expected at least four property cards");
});

await check("search and transparent-price filter apply", async () => {
  await page.getByRole("button", { name: /Suburb, postcode or street/ }).click();
  await page.getByLabel("Where").fill("Paddington");
  await page.getByRole("button", { name: "Show matching homes" }).click();
  await page.getByText("The Rose House", { exact: true }).first().waitFor();
  await page.waitForFunction(() => document.querySelectorAll("article.property-card").length === 1);
  if (await page.locator("article.property-card").count() !== 1) throw new Error("Location filter did not narrow the feed");
  await page.getByRole("button", { name: /Paddington/ }).first().click();
  await page.getByRole("button", { name: "Clear all" }).click();
  await page.getByRole("button", { name: "Show matching homes" }).click();
  await page.waitForFunction(() => document.querySelectorAll("article.property-card").length >= 4);
});

await check("save action updates the Saved collection", async () => {
  await page.getByRole("button", { name: "Save The Rose House" }).click();
  await page.getByRole("button", { name: "Saved" }).last().click();
  await page.getByRole("heading", { name: "Homes worth another look" }).waitFor();
  await page.getByRole("heading", { name: "The Rose House" }).waitFor();
});

await check("property detail drawer opens and closes", async () => {
  await page.getByRole("button", { name: "Explore" }).last().click();
  await page.locator(".property-card .media-open").first().click();
  await page.getByRole("heading", { name: "The useful details" }).waitFor();
  await page.getByRole("button", { name: "Close details" }).click();
});

await check("property-specific messaging opens", async () => {
  await page.getByRole("button", { name: "Message the agent about The Rose House" }).click();
  await page.locator(".conversation > header strong").filter({ hasText: "Mia Chen" }).waitFor();
  await page.getByRole("textbox", { name: "Message" }).fill("Is the building and pest report available?");
  if (!(await page.getByRole("button", { name: "Send message" }).isEnabled())) throw new Error("Message composer did not enable");
});

const overlay = await page.locator("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay").count();
checks.push({ label: "no framework error overlay", status: overlay ? "FAIL" : "PASS" });
console.log(JSON.stringify(checks, null, 2));

await browser.close();
if (checks.some((item) => item.status === "FAIL")) process.exit(1);
