import { chromium } from "playwright";

const browser = await chromium.launch();
const appUrl = process.env.APP_URL || "http://localhost:3000";
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

await page.goto(appUrl, { waitUntil: "networkidle" });
const apiResponse = await page.request.get(`${appUrl}/api/listings`);
const apiPayload = await apiResponse.json();
const suppliedListings = apiPayload.listings || [];
const firstListing = suppliedListings[0];

await check("home feed loads from the app API", async () => {
  await page.getByRole("heading", { name: "Find the right property, faster." }).waitFor();
  if (apiPayload.source !== "neon") throw new Error(`Expected Neon inventory, received ${apiPayload.source}`);
  if (suppliedListings.length !== 30) throw new Error(`Expected 30 supplied properties, received ${suppliedListings.length}`);
  if (await page.locator("article.property-card").count() !== 30) throw new Error("Expected all 30 properties in the initial feed");
});

await check("address search narrows the supplied inventory", async () => {
  await page.getByRole("button", { name: /Suburb, postcode or street/ }).click();
  await page.getByLabel("Where").fill(firstListing.address);
  await page.getByRole("button", { name: "Show matching homes" }).click();
  await page.getByText(firstListing.title, { exact: true }).first().waitFor();
  await page.waitForFunction(() => document.querySelectorAll("article.property-card").length === 1);
  if (await page.locator("article.property-card").count() !== 1) throw new Error("Location filter did not narrow the feed");
  await page.locator("button.search-bar").click();
  await page.getByRole("button", { name: "Clear all" }).click();
  await page.getByRole("button", { name: "Show matching homes" }).click();
  await page.waitForFunction(() => document.querySelectorAll("article.property-card").length === 30);
});

await check("gallery advances without a visible loading wait", async () => {
  const card = page.locator("article.property-card").first();
  const photo = card.locator(".property-media img");
  const before = await photo.getAttribute("src");
  const startedAt = Date.now();
  await card.getByRole("button", { name: "Next photograph" }).click();
  await page.waitForFunction((previous) => {
    const image = document.querySelector("article.property-card .property-media img");
    return image?.getAttribute("src") !== previous && image.complete && image.naturalWidth > 0;
  }, before);
  const elapsed = Date.now() - startedAt;
  if (elapsed > 150) throw new Error(`Gallery advance took ${elapsed}ms`);
});

await check("save action updates the Saved collection", async () => {
  await page.getByRole("button", { name: `Save ${firstListing.title}` }).first().click();
  await page.getByRole("button", { name: "Saved" }).last().click();
  await page.getByRole("heading", { name: "Homes worth another look" }).waitFor();
  await page.getByRole("heading", { name: firstListing.title }).waitFor();
});

await check("property detail drawer opens and closes", async () => {
  await page.getByRole("button", { name: "Explore" }).last().click();
  await page.locator(".property-card .details-button").first().click();
  await page.getByRole("heading", { name: "The useful details" }).waitFor();
  await page.getByRole("button", { name: "Close details" }).click();
});

await check("property-specific messaging opens", async () => {
  await page.getByRole("button", { name: `Message the agent about ${firstListing.title}` }).first().click();
  await page.locator(".conversation > header strong").filter({ hasText: firstListing.agentName }).waitFor();
  await page.getByRole("textbox", { name: "Message" }).fill("Is the building and pest report available?");
  if (!(await page.getByRole("button", { name: "Send message" }).isEnabled())) throw new Error("Message composer did not enable");
});

const overlay = await page.locator("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay").count();
checks.push({ label: "no framework error overlay", status: overlay ? "FAIL" : "PASS" });
console.log(JSON.stringify(checks, null, 2));

await browser.close();
if (checks.some((item) => item.status === "FAIL")) process.exit(1);
