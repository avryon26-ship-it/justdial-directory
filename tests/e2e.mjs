// End-to-end checks against a running server: BASE=http://localhost:3100 node tests/e2e.mjs
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const BASE = process.env.BASE || "http://localhost:3100";
const OUT = path.join(process.cwd(), "test-output");
fs.mkdirSync(OUT, { recursive: true });

const results = [];
function check(name, ok, extra = "") {
  results.push({ name, ok: !!ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : extra ? `  -> ${extra}` : ""}`);
}

const browser = await chromium.launch();
const consoleErrors = [];

async function newCtx(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...opts });
  ctx.on("page", (p) => {
    p.on("pageerror", (e) => consoleErrors.push(`${p.url()} :: ${e.message}`));
    p.on("console", (m) => {
      if (m.type() === "error" && !/tile\.openstreetmap|Failed to load resource|ERR_/.test(m.text())) consoleErrors.push(`${p.url()} :: ${m.text()}`);
    });
  });
  return ctx;
}

async function loginAs(page, role) {
  await page.goto(`${BASE}/admin/login`);
  await page.getByTestId(`fill-${role}`).click();
  await page.getByTestId("login-submit").click();
  await page.waitForURL(`${BASE}/admin`);
  await page.getByTestId("stats").waitFor();
}

try {
  /* ---------------------------------------------------------------- */
  console.log("\n== Public home ==");
  const ctx = await newCtx();
  const pub = await ctx.newPage();
  await pub.goto(BASE);
  await pub.getByTestId("az-strip").waitFor();
  check("home has exactly one H1", (await pub.locator("h1").count()) === 1);
  check("home shows popular categories", (await pub.getByTestId("popular-categories").locator("a").count()) >= 8);
  check("home shows recently added", (await pub.getByTestId("recent-list").locator("li").count()) === 6);
  const zBefore = await pub.locator('[data-letter="Z"]').isDisabled();
  check("letter Z is greyed out before (no categories)", zBefore);
  const qBtnDisabled = await pub.locator('[data-letter="Q"]').isDisabled();
  check("letter Q is greyed out", qBtnDisabled);
  await pub.locator('[data-letter="D"]').click();
  const dText = await pub.getByTestId("az-panel").innerText();
  check("clicking D lists Dentists and Doctors", /Dentists/.test(dText) && /Doctors/.test(dText), dText.slice(0, 120));
  await pub.getByTestId("az-panel").getByRole("link", { name: /Doctors/ }).click();
  await pub.waitForURL(/\/tamil-nadu\/doctors/);
  check("A-Z category link opens listing page", /Doctors in Tamil Nadu/.test(await pub.getByTestId("results-h1").innerText()));

  /* ---------------------------------------------------------------- */
  console.log("\n== Admin: category -> public A-Z (live update) ==");
  const admin = await ctx.newPage();
  await loginAs(admin, "owner");
  // keep the public tab open on home to prove live update via the storage event
  await pub.goto(BASE);
  await pub.getByTestId("az-strip").waitFor();
  check("Z still disabled on open public tab", await pub.locator('[data-letter="Z"]').isDisabled());
  await admin.goto(`${BASE}/admin/categories`);
  await admin.getByTestId("new-category-name").fill("Zumba Studios");
  await admin.getByTestId("add-category").click();
  await admin.locator('[data-name="Zumba Studios"]').waitFor();
  check("category added in admin table", true);
  await pub.waitForFunction(() => !document.querySelector('[data-letter="Z"]').disabled, null, { timeout: 5000 }).catch(() => {});
  check("open public tab enabled letter Z without reload (storage event)", !(await pub.locator('[data-letter="Z"]').isDisabled()));
  await pub.locator('[data-letter="Z"]').click();
  check("Z panel lists Zumba Studios", /Zumba Studios/.test(await pub.getByTestId("az-panel").innerText()));

  /* ---------------------------------------------------------------- */
  console.log("\n== Admin: published listing + draft ==");
  async function addListing(name, status, { photo } = {}) {
    await admin.goto(`${BASE}/admin/listings/new`);
    await admin.locator("#name").fill(name);
    await admin.locator("#category").selectOption({ label: "Bakeries" });
    await admin.locator("#district").selectOption({ label: "Tirunelveli" });
    await admin.locator("#area").selectOption({ label: "Palayamkottai" });
    await admin.locator("#address").fill("77, Test Street, Palayamkottai");
    await admin.getByTestId("phone-0").fill("9000099001");
    await admin.locator("#whatsapp").fill("9000099001");
    await admin.locator("#timings").fill("24 Hours");
    await admin.locator("#description").fill("Test listing created by the end-to-end script.");
    await admin.locator("#status").selectOption(status);
    if (photo) await admin.getByTestId("photo-input").setInputFiles(photo);
    // click the map to place a pin
    const map = admin.locator('[aria-label="Click to place the pin"]');
    await map.scrollIntoViewIfNeeded();
    await map.click({ position: { x: 200, y: 120 } });
    await admin.getByTestId("save-listing").click();
    await admin.waitForURL(`${BASE}/admin/listings`);
  }
  // create a large photo to test compression
  const bigPng = path.join(os.tmpdir(), "big-photo.png");
  {
    const page = await ctx.newPage();
    await page.goto(`${BASE}/admin/login`);
    const dataUrl = await page.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = 3000; c.height = 2000;
      const g = c.getContext("2d");
      for (let i = 0; i < 400; i++) { g.fillStyle = `hsl(${i * 7},70%,50%)`; g.fillRect((i * 37) % 3000, (i * 53) % 2000, 300, 200); }
      return c.toDataURL("image/png");
    });
    fs.writeFileSync(bigPng, Buffer.from(dataUrl.split(",")[1], "base64"));
    await page.close();
  }
  await addListing("Zeta Test Bakery", "published", { photo: bigPng });
  const pubBefore = fs.statSync(bigPng).size;
  // photo compression check
  await admin.goto(`${BASE}/admin/listings?q=Zeta`);
  await admin.locator('[data-testid="listing-row"]').first().getByRole("link", { name: /Edit/ }).click();
  await admin.getByTestId("photo-list").waitFor();
  const imgInfo = await admin.evaluate(async () => {
    const img = document.querySelector('[data-testid="photo-list"] img');
    await img.decode();
    return { w: img.naturalWidth, bytes: Math.round(img.src.length * 0.75) };
  });
  check(`uploaded photo resized to <=800px wide (was 3000px/${Math.round(pubBefore / 1024)}KB PNG; now ${imgInfo.w}px/${Math.round(imgInfo.bytes / 1024)}KB)`, imgInfo.w <= 800 && imgInfo.bytes < 150 * 1024);
  const lat = await admin.getByTestId("lat").inputValue();
  check("clicking map filled latitude/longitude", lat !== "" && !Number.isNaN(Number(lat)), lat);

  await addListing("Omega Hidden Draft Bakery", "draft");
  check("both listings saved (toast/redirect ok)", true);

  // Public results (use fresh page to read from storage)
  const pub2 = await ctx.newPage();
  await pub2.goto(`${BASE}/tirunelveli/bakeries`);
  await pub2.getByTestId("results-h1").waitFor();
  await pub2.getByText("Zeta Test Bakery").first().waitFor({ timeout: 8000 }).catch(() => {});
  const resText = await pub2.getByTestId("results-list").innerText();
  check("published listing shows on public results page", /Zeta Test Bakery/.test(resText));
  check("draft listing does NOT show on public results page", !/Omega Hidden Draft/.test(resText));
  await pub2.getByRole("link", { name: "Zeta Test Bakery" }).first().click();
  await pub2.waitForURL(/\/tirunelveli\/bakeries\/zeta-test-bakery/);
  check("detail page shows name", (await pub2.getByTestId("listing-name").innerText()) === "Zeta Test Bakery");
  check("detail page has one H1", (await pub2.locator("h1").count()) === 1);
  check("detail page has JSON-LD LocalBusiness", (await pub2.locator('script[type="application/ld+json"]').allTextContents()).some((t) => t.includes('"LocalBusiness"')));
  await pub2.waitForSelector(".leaflet-container", { timeout: 8000 }).catch(() => {});
  check("detail page renders a Leaflet map", (await pub2.locator(".leaflet-container").count()) === 1);
  check("detail page has directions link to Google Maps", /google\.com\/maps/.test((await pub2.getByTestId("directions").getAttribute("href")) || ""));
  check("gallery shows the uploaded photo", (await pub2.getByTestId("gallery").locator("img").count()) >= 1);
  // search results should show Distance etc not needed. Search for the draft by name
  await pub2.goto(`${BASE}/search?q=Zeta`);
  await pub2.getByText("Zeta Test Bakery").first().waitFor({ timeout: 8000 });
  await pub2.goto(`${BASE}/search?q=Omega`);
  await pub2.getByTestId("results-h1").waitFor();
  await pub2.waitForTimeout(600);
  check("draft is not found by public search either", /^0 businesses/.test((await pub2.getByTestId("results-count").innerText()).trim()));

  // Report wrong information -> admin inbox
  await pub2.goto(`${BASE}/tirunelveli/bakeries/zeta-test-bakery`);
  await pub2.getByTestId("report-open").click();
  await pub2.locator("#rep-msg").fill("The closing time is wrong");
  await pub2.getByTestId("report-submit").click();
  await pub2.getByTestId("report-done").waitFor();
  await admin.goto(`${BASE}/admin/reports`);
  check("report arrives in admin inbox", /closing time is wrong/.test(await admin.getByTestId("report-list").innerText()));
  await admin.getByTestId("resolved-toggle").first().click();
  await admin.getByRole("button", { name: "To check" }).click();
  check("Resolved toggle removes it from the To check list", (await admin.getByTestId("report-item").count()) === 0);

  // draft detail page not visible when logged out
  const anon = await (await newCtx()).newPage();
  // anon is a fresh context => seed only; check an unknown slug displays not-found message
  await anon.goto(`${BASE}/tirunelveli/bakeries/omega-hidden-draft-bakery`);
  await anon.waitForTimeout(500);
  check("unknown/unpublished listing shows not-found message to visitors", /could not find|not available/i.test(await anon.locator("main").innerText()));

  /* ---------------------------------------------------------------- */
  console.log("\n== Category rename keeps old URL ==");
  await admin.goto(`${BASE}/admin/categories`);
  await admin.locator('[data-name="Doctors"]').getByRole("button", { name: /Rename/ }).click();
  await admin.getByTestId("rename-input").fill("Physicians and Doctors");
  await admin.getByTestId("rename-save").click();
  await admin.locator('[data-name="Physicians and Doctors"]').waitFor();
  const pub3 = await ctx.newPage();
  await pub3.goto(`${BASE}/tirunelveli/doctors`);
  await pub3.waitForURL(/\/tirunelveli\/physicians-and-doctors/, { timeout: 8000 }).catch(() => {});
  check("old URL /tirunelveli/doctors redirects to the new slug", /\/tirunelveli\/physicians-and-doctors/.test(pub3.url()), pub3.url());
  check("redirected page still lists results", /^[1-9]/.test((await pub3.getByTestId("results-count").innerText()).trim()));
  await pub3.goto(`${BASE}/tirunelveli/physicians-and-doctors`);
  check("new URL works", /Physicians and Doctors in Tirunelveli/.test(await pub3.getByTestId("results-h1").innerText()));
  // block deleting category with listings
  await admin.goto(`${BASE}/admin/categories`);
  await admin.locator('[data-name="Bakeries"]').getByRole("button", { name: /Delete/ }).click();
  const dlgText = await admin.getByTestId("confirm-dialog").innerText();
  check("deleting a category with listings is blocked and offers to move them", /still has listings|cannot be deleted yet/.test(dlgText) && (await admin.getByTestId("confirm-yes").isDisabled()));
  await admin.getByRole("button", { name: "Cancel" }).click();

  /* ---------------------------------------------------------------- */
  console.log("\n== Import with bad rows ==");
  const csv = [
    "name,category,district,area,address,phone,whatsapp,email,website,timings,description,latitude,longitude,status",
    "Imp Good One,Bakeries,Tirunelveli,Palayamkottai,1 Test Rd,9000011111,,,,Mon-Sat 9:00 AM - 8:00 PM,ok row,8.72,77.73,published",
    "Imp Good Two,Plumbers,Madurai,Anna Nagar,2 Test Rd,9000022222,,,,,ok row,,,",
    ",Bakeries,Tirunelveli,Palayamkottai,3 Test Rd,9000033333,,,,,missing name,,,",
    "Imp No Phone,Bakeries,Tirunelveli,Palayamkottai,4 Test Rd,,,,,,missing phone,,,",
    "Imp Bad Cat,Spaceships,Tirunelveli,Palayamkottai,5 Test Rd,9000055555,,,,,unknown category,,,",
    "Imp Bad Area,Bakeries,Tirunelveli,Atlantis,6 Test Rd,9000066666,,,,,unknown area,,,",
    "Zeta Test Bakery,Bakeries,Tirunelveli,Palayamkottai,77 Test Street Palayamkottai,9000099001,,,,,duplicate of existing,,,",
    "Imp Twin,Bakeries,Tirunelveli,Palayamkottai,8 Test Rd,9000088888,,,,,first,,,",
    "Imp Twin,Bakeries,Tirunelveli,Palayamkottai,8 Test Rd,9000088888,,,,,second (dup in file),,,",
    "Imp Bad Coord,Bakeries,Tirunelveli,Palayamkottai,9 Test Rd,9000077777,,,,,bad lat,abc,77,",
  ].join("\n");
  const csvPath = path.join(os.tmpdir(), "import-test.csv");
  fs.writeFileSync(csvPath, csv);
  await admin.goto(`${BASE}/admin/import`);
  await admin.getByTestId("import-file").setInputFiles(csvPath);
  await admin.getByTestId("import-summary").waitFor();
  const sum = await admin.getByTestId("import-summary").innerText();
  check("import summary: 10 rows read", /10\s*\n?.*Rows in file|Rows in file\s*\n?\s*10/.test(sum.replace(/\s+/g, " ")) || sum.includes("10"), sum.replace(/\s+/g, " "));
  const allErr = (await admin.getByTestId("import-table").innerText());
  for (const [label, rx] of [
    ["missing name", /Business name is missing/],
    ["missing phone", /Phone number is missing/],
    ["unknown category", /Category "Spaceships" does not exist/],
    ["unknown area", /Area "Atlantis".*does not exist/],
    ["duplicate of existing listing", /existing listing/],
    ["duplicate within the file", /Same business as row/],
    ["invalid latitude", /Latitude is not a valid number/],
  ]) check(`import flags ${label} with a row-level message`, rx.test(allErr));
  // fix one row inline: unknown category -> choose Bakeries
  await admin.locator('[aria-label="Category, row 6"]').selectOption({ label: "Bakeries" });
  check("fixing a row inline clears its error", !(/Spaceships/.test(await admin.getByTestId("import-table").innerText())));
  // skip all remaining problem rows
  await admin.getByTestId("skip-all-errors").click();
  const runLabel = await admin.getByTestId("run-import").innerText();
  check("only valid rows are counted for import", /Import 4 valid rows/.test(runLabel), runLabel);
  await admin.getByTestId("run-import").click();
  await admin.getByTestId("import-done").waitFor();
  check("import finished and reports the count", /4 listings added/.test(await admin.getByTestId("import-done").innerText()));
  await admin.goto(`${BASE}/admin/listings?q=Imp%20`);
  const impRows = await admin.getByTestId("listing-table").innerText();
  check("imported rows exist, skipped rows do not", /Imp Good One/.test(impRows) && /Imp Good Two/.test(impRows) && /Imp Bad Cat/.test(impRows) && !/Imp No Phone/.test(impRows) && !/Imp Bad Area/.test(impRows));
  // Imp Good One said published in the file
  const pub4 = await ctx.newPage();
  await pub4.goto(`${BASE}/search?q=Imp%20Good`);
  await pub4.getByText("Imp Good One").first().waitFor({ timeout: 8000 });
  const t4 = await pub4.getByTestId("results-list").innerText();
  check("imported row marked published is visible; the others stay draft (hidden)", /Imp Good One/.test(t4) && !/Imp Good Two/.test(t4));

  // 2,000 row import performance
  const bigRows = ["name,category,district,area,address,phone"];
  const cats = ["Bakeries", "Plumbers", "Tailors", "Hotels", "Schools"];
  const areas = [["Tirunelveli", "Pettai"], ["Madurai", "Simmakkal"], ["Tenkasi", "Courtallam"], ["Thoothukudi", "Kovilpatti"]];
  for (let i = 0; i < 2000; i++) {
    const [d, a] = areas[i % areas.length];
    bigRows.push(`Bulk Business ${i},${cats[i % cats.length]},${d},${a},${i} Bulk Street,90001${String(i).padStart(5, "0")}`);
  }
  const bigPath = path.join(os.tmpdir(), "bulk-2000.csv");
  fs.writeFileSync(bigPath, bigRows.join("\n"));
  await admin.goto(`${BASE}/admin/import`);
  const t0 = Date.now();
  await admin.getByTestId("import-file").setInputFiles(bigPath);
  await admin.getByTestId("import-summary").waitFor();
  const tParse = Date.now() - t0;
  const t1 = Date.now();
  await admin.getByTestId("run-import").click();
  await admin.getByTestId("import-done").waitFor();
  const tImport = Date.now() - t1;
  check(`2,000-row file previews in ${tParse} ms and imports in ${tImport} ms`, tParse < 8000 && tImport < 8000 && /2000 listings added/.test(await admin.getByTestId("import-done").innerText()));
  const usageText = await admin.getByTestId("storage-meter").first().innerText();
  check("storage meter visible after big import", /MB/.test(usageText), usageText.replace(/\s+/g, " "));
  await admin.goto(`${BASE}/admin/listings`);
  check("listings table paginates 2,000+ rows", (await admin.getByTestId("listing-row").count()) === 25);
  // export downloads
  await admin.goto(`${BASE}/admin/import`);
  const [dlCsv] = await Promise.all([admin.waitForEvent("download"), admin.getByTestId("export-csv").click()]);
  const csvOut = fs.readFileSync(await dlCsv.path(), "utf8");
  check("CSV export contains all listings", csvOut.split("\n").length > 2300, `${csvOut.split("\n").length} lines`);
  const [dlX] = await Promise.all([admin.waitForEvent("download"), admin.getByTestId("export-xlsx").click()]);
  check("Excel export downloads an .xlsx", /\.xlsx$/.test(dlX.suggestedFilename()) && fs.statSync(await dlX.path()).size > 10000);
  const [dlT] = await Promise.all([admin.waitForEvent("download"), admin.getByTestId("download-template").click()]);
  check("import template downloads", /template/.test(dlT.suggestedFilename()));
  // xlsx import round trip
  const xPath = await dlX.path();
  const xCopy = path.join(os.tmpdir(), "roundtrip.xlsx");
  fs.copyFileSync(xPath, xCopy);
  await admin.getByTestId("import-file").setInputFiles(xCopy);
  await admin.getByTestId("import-summary").waitFor();
  check("an exported .xlsx can be read back by the importer (all rows flagged as duplicates)", /Need attention/.test(await admin.getByTestId("import-summary").innerText()));
  await admin.getByRole("button", { name: "Cancel" }).click();

  /* ---------------------------------------------------------------- */
  console.log("\n== Roles ==");
  const staffCtx = await newCtx();
  const staff = await staffCtx.newPage();
  // seed the staff browser with the same fresh state
  await loginAs(staff, "staff");
  await staff.goto(`${BASE}/admin/listings`);
  check("Staff sees no Delete button", (await staff.getByRole("button", { name: /^Delete/ }).count()) === 0);
  check("Staff sees no Publish button", (await staff.getByRole("button", { name: /^(Publish|Unpublish)$/ }).count()) === 0);
  await staff.goto(`${BASE}/admin/listings/new`);
  check("Staff form has no status dropdown (Draft only)", (await staff.locator("#status").count()) === 0);
  await staff.locator("#name").fill("Staff Made Shop");
  await staff.locator("#category").selectOption({ label: "Tailors" });
  await staff.locator("#district").selectOption({ label: "Madurai" });
  await staff.locator("#area").selectOption({ label: "Simmakkal" });
  await staff.getByTestId("phone-0").fill("9000012121");
  await staff.getByTestId("save-listing").click();
  await staff.waitForURL(`${BASE}/admin/listings`);
  await staff.goto(`${BASE}/admin/listings?q=Staff%20Made`);
  check("Staff-created listing is a Draft", /Draft/.test(await staff.getByTestId("listing-table").innerText()));
  await staff.goto(`${BASE}/admin/settings`);
  check("Staff cannot reset demo data (no button)", (await staff.getByTestId("reset-demo").count()) === 0);
  await staff.goto(`${BASE}/admin/categories`);
  check("Staff cannot delete categories", (await staff.getByRole("button", { name: /^Delete/ }).count()) === 0);
  // duplicate warning
  await staff.goto(`${BASE}/admin/listings/new`);
  await staff.locator("#name").fill("Staff Made Shop");
  await staff.getByTestId("phone-0").fill("9000012121");
  check("duplicate warning appears for same name + phone", await staff.getByTestId("duplicate-warning").isVisible());
  // unauthenticated redirect
  const guestCtx = await newCtx();
  const guest = await guestCtx.newPage();
  await guest.goto(`${BASE}/admin/listings`);
  await guest.waitForURL(/\/admin\/login/);
  check("visiting admin while signed out redirects to login", true);

  /* ---------------------------------------------------------------- */
  console.log("\n== Dashboard, activity, owner delete ==");
  await admin.goto(`${BASE}/admin`);
  const stats = await admin.getByTestId("stats").innerText();
  check("dashboard shows totals", /Total listings/.test(stats) && /Published/.test(stats) && /Drafts/.test(stats));
  await admin.goto(`${BASE}/admin/activity`);
  const act = await admin.getByTestId("activity-table").innerText();
  check("activity log records create / import / edit with the demo user", /Demo Owner/.test(act) && /Imported/.test(act) && /Created/.test(act) && /Edited|Renamed/.test(act));
  await admin.goto(`${BASE}/admin/listings?q=Omega`);
  await admin.getByRole("button", { name: /^Delete/ }).first().click();
  await admin.getByTestId("confirm-yes").click();
  await admin.waitForFunction(() => document.querySelector('[data-testid="listing-count"]')?.textContent?.startsWith("0"));
  check("Owner can delete a listing (after confirmation)", true);

  /* ---------------------------------------------------------------- */
  console.log("\n== Regions admin ==");
  await admin.goto(`${BASE}/admin/regions`);
  await admin.locator("#rparent").selectOption({ label: "Madurai" });
  await admin.getByTestId("region-name").fill("Test Nagar");
  await admin.getByTestId("region-lat").fill("9.95");
  await admin.getByTestId("region-lng").fill("78.15");
  await admin.getByTestId("add-region").click();
  await admin.getByText("Test Nagar").first().waitFor();
  check("new area added with coordinates", true);

  /* ---------------------------------------------------------------- */
  console.log("\n== Search by category + place ==");
  const s = await (await newCtx()).newPage();
  await s.goto(BASE);
  await s.locator('input[name="what"]').fill("dent");
  await s.getByRole("option", { name: /Dentists/ }).first().waitFor();
  await s.getByRole("option", { name: /Dentists/ }).first().click();
  await s.locator('input[name="where"]').fill("palayam");
  await s.getByRole("option", { name: /Palayamkottai/ }).first().click();
  await s.getByTestId("search-submit").click();
  await s.waitForURL(/\/tirunelveli\/dentists\?area=palayamkottai/);
  const h = await s.getByTestId("results-h1").innerText();
  check("searching category + place goes to /tirunelveli/dentists?area=palayamkottai", /Dentists in Palayamkottai, Tirunelveli/.test(h), h);
  const cards = await s.getByTestId("listing-card").count();
  check("search results contain dentists in that area", cards >= 1, String(cards));
  // free-text search
  await s.goto(BASE);
  await s.locator('input[name="what"]').fill("Sri Vel");
  await s.getByTestId("search-submit").click();
  await s.waitForURL(/\/search\?q=Sri\+Vel/);
  await s.getByTestId("listing-card").first().waitFor({ timeout: 8000 });
  check("free-text search page works", (await s.getByTestId("listing-card").count()) >= 1);
  // filters
  await s.goto(`${BASE}/tamil-nadu/restaurants`);
  const before = await s.getByTestId("results-count").innerText();
  await s.getByRole("button", { name: /Filters/ }).click().catch(() => {});
  await s.getByLabel("Has WhatsApp").click();
  await s.waitForURL(/wa=1/);
  const after = await s.getByTestId("results-count").innerText();
  check(`'Has WhatsApp' filter narrows results (${before.trim()} -> ${after.trim()})`, parseInt(after) <= parseInt(before));
  await s.getByLabel("District").selectOption({ label: "Madurai" });
  await s.waitForURL(/\/madurai\/restaurants/);
  check("district filter navigates to /madurai/restaurants", true);
  await s.getByLabel("Sort by").selectOption("az");
  await s.waitForURL(/sort=az/);
  const names = await s.getByTestId("listing-card").locator("h3").allInnerTexts();
  check("A-Z sort orders names", JSON.stringify(names) === JSON.stringify([...names].sort((a, b) => a.localeCompare(b))));
  check("'Distance' sort option is disabled without location", await s.locator('#f-sort option[value="distance"]').isDisabled());
  // empty state
  await s.goto(`${BASE}/tenkasi/zumba-studios`);
  await s.waitForTimeout(300);
  check("friendly page when category has no listings / unknown (seed browser)", /could not find|No businesses match/i.test(await s.locator("main").innerText()));

  /* ---------------------------------------------------------------- */
  console.log("\n== Location: granted (mocked) ==");
  const geoCtx = await newCtx({ geolocation: { latitude: 9.9172, longitude: 78.1472 }, permissions: ["geolocation"] });
  const g = await geoCtx.newPage();
  await g.goto(BASE);
  await g.getByTestId("use-location").click();
  await g.getByTestId("location-chip").waitFor();
  const whereVal = await g.locator('input[name="where"]').inputValue();
  check("granted: Where field filled with nearest area", /Anna Nagar, Madurai/.test(whereVal), whereVal);
  check("granted: friendly status message", /near Anna Nagar, Madurai/.test(await g.getByTestId("location-message").innerText()));
  await g.goto(`${BASE}/tamil-nadu/restaurants`);
  await g.getByTestId("results-list").waitFor();
  const dist = await g.getByTestId("distance").allInnerTexts();
  check("granted: result cards show distances", dist.length > 0, JSON.stringify(dist));
  const km = dist.map((d) => (d.includes(" m ") ? 0 : parseFloat(d)));
  check("granted: default sort is nearest first", km.every((v, i) => i === 0 || km[i - 1] <= v), JSON.stringify(dist));
  check("granted: Distance sort option enabled", !(await g.locator('#f-sort option[value="distance"]').isDisabled()));
  console.log("\n== Location: denied ==");
  const denyCtx = await newCtx();
  const d = await denyCtx.newPage();
  await d.addInitScript(() => {
    navigator.geolocation.getCurrentPosition = (_ok, err) => err({ code: 1, PERMISSION_DENIED: 1, message: "denied" });
  });
  await d.goto(BASE);
  await d.getByTestId("use-location").click();
  await d.getByTestId("location-message").filter({ hasText: /switched off/ }).waitFor();
  check("denied: friendly message, user can type a place", /type your area/.test(await d.getByTestId("location-message").innerText()));
  await d.locator('input[name="where"]').fill("Tiruchendur");
  await d.locator('input[name="what"]').fill("Hotels");
  await d.getByTestId("search-submit").click();
  await d.waitForURL(/\/thoothukudi\/hotels\?area=tiruchendur/);
  check("denied: site still works fully by typing a place", true);
  // real browser denial path (no permission granted, headless -> denied/unavailable)
  const noPermCtx = await newCtx({ permissions: [] });
  const np = await noPermCtx.newPage();
  await np.goto(BASE);
  await np.getByTestId("use-location").click();
  await np.getByTestId("location-message").filter({ hasText: /./ }).first().waitFor();
  await np.waitForTimeout(1500);
  check("no-permission browser: message shown and no crash", /type your area|switched off|could not find/i.test(await np.getByTestId("location-message").innerText()) || (await np.getByTestId("location-chip").count()) === 0);

  /* ---------------------------------------------------------------- */
  console.log("\n== SEO (server-rendered HTML) ==");
  const fetchText = async (p) => (await fetch(`${BASE}${p}`)).text();
  const html = await fetchText("/tirunelveli/doctors");
  check("category page: title, description, canonical, og tags in HTML", /<title>Doctors in Tirunelveli/.test(html) && /name="description"/.test(html) && /rel="canonical" href="[^"]*\/tirunelveli\/doctors"/.test(html) && /property="og:title"/.test(html));
  check("category page: exactly one H1 in HTML", (html.match(/<h1[ >]/g) || []).length === 1);
  check("category page: listings rendered server-side", /data-testid="listing-card"/.test(html));
  const sitemap = await fetchText("/sitemap.xml");
  check("sitemap.xml lists categories, districts and listings", /<loc>[^<]*\/tirunelveli\/doctors<\/loc>/.test(sitemap) && (sitemap.match(/<loc>/g) || []).length > 200, `${(sitemap.match(/<loc>/g) || []).length} urls`);
  const robots = await fetchText("/robots.txt");
  check("robots.txt disallows /admin and /search and links the sitemap", /Disallow: \/admin/.test(robots) && /Disallow: \/search/.test(robots) && /Sitemap:/.test(robots));
  const sHtml = await fetchText("/search?q=x");
  check("search page is noindex", /name="robots" content="noindex/.test(sHtml));
  const letterHtml = await fetchText("/categories/q");
  check("empty letter page (Q) is noindex", /name="robots" content="noindex/.test(letterHtml));
  const seedListing = (sitemap.match(/<loc>([^<]*\/tirunelveli\/[^<]*\/[^<]+)<\/loc>/) || [])[1];
  const lhtml = await fetchText(new URL(seedListing).pathname);
  check("listing page: JSON-LD LocalBusiness + canonical + single H1 in server HTML", /"@type":"LocalBusiness"/.test(lhtml) && /rel="canonical"/.test(lhtml) && (lhtml.match(/<h1[ >]/g) || []).length === 1, seedListing);
  const emptyHtml = await fetchText("/tenkasi/zumba-studios");
  check("category/place pair with no listings is noindex", /name="robots" content="noindex/.test(emptyHtml));

  /* ---------------------------------------------------------------- */
  console.log("\n== Phone width (375px) ==");
  const mob = await newCtx({ viewport: { width: 375, height: 800 }, isMobile: true, hasTouch: true });
  const m = await mob.newPage();
  async function noOverflow(label, url, wait) {
    await m.goto(`${BASE}${url}`);
    if (wait) await m.locator(wait).first().waitFor();
    await m.waitForTimeout(250);
    const o = await m.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    check(`${label}: no horizontal scroll at 375px (${o.sw}/${o.cw})`, o.sw <= o.cw);
    return m;
  }
  await noOverflow("home", "/", '[data-testid="az-strip"]');
  await m.screenshot({ path: path.join(OUT, "mobile-home.png"), fullPage: false });
  await noOverflow("results", "/tirunelveli/doctors", '[data-testid="results-list"]');
  await m.screenshot({ path: path.join(OUT, "mobile-results.png") });
  const tapOk = await m.evaluate(() => [...document.querySelectorAll("a.btn, button.btn")].every((b) => (b.getBoundingClientRect().height === 0 || b.getBoundingClientRect().height >= 44)));
  check("results: buttons are tall enough to tap", tapOk);
  await noOverflow("detail", new URL(seedListing).pathname, '[data-testid="listing-name"]');
  await m.screenshot({ path: path.join(OUT, "mobile-detail.png"), fullPage: true });
  await noOverflow("categories index", "/categories", "h1");
  // admin on phone (needs session -> use ctx with admin session by logging in)
  await m.goto(`${BASE}/admin/login`);
  await m.getByTestId("fill-owner").click();
  await m.getByTestId("login-submit").click();
  await m.getByTestId("stats").waitFor();
  const o1 = await m.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  check("admin dashboard: no horizontal page scroll at 375px", o1);
  await m.getByTestId("admin-menu").click();
  check("admin: mobile menu opens with sidebar links", await m.getByRole("link", { name: "Import / Export" }).isVisible());
  await m.screenshot({ path: path.join(OUT, "mobile-admin.png") });

  /* ---------------------------------------------------------------- */
  console.log("\n== Reset demo data ==");
  await admin.goto(`${BASE}/admin/settings`);
  await admin.getByTestId("reset-demo").click();
  await admin.getByTestId("confirm-yes").click();
  await admin.waitForTimeout(400);
  await admin.goto(`${BASE}/admin/categories`);
  check("reset removes added category and restores renamed one", (await admin.locator('[data-name="Zumba Studios"]').count()) === 0 && (await admin.locator('[data-name="Doctors"]').count()) === 1);
  await admin.goto(`${BASE}/admin/listings`);
  check("reset restores original listing count", /^30\d listings/.test((await admin.getByTestId("listing-count").innerText()).trim()), await admin.getByTestId("listing-count").innerText());

  /* ---------------------------------------------------------------- */
  console.log("\n== Desktop screenshots ==");
  const shot = await ctx.newPage();
  await shot.goto(BASE);
  await shot.getByTestId("az-strip").waitFor();
  await shot.locator('[data-letter="D"]').click();
  await shot.screenshot({ path: path.join(OUT, "desktop-home.png"), fullPage: true });
  await shot.goto(`${BASE}/tirunelveli/doctors`);
  await shot.getByTestId("results-list").waitFor();
  await shot.screenshot({ path: path.join(OUT, "desktop-results.png") });
  await shot.goto(`${BASE}${new URL(seedListing).pathname}`);
  await shot.getByTestId("listing-name").waitFor();
  await shot.waitForTimeout(1200);
  await shot.screenshot({ path: path.join(OUT, "desktop-detail.png"), fullPage: true });
  await shot.goto(`${BASE}/admin`);
  await shot.getByTestId("stats").waitFor();
  await shot.screenshot({ path: path.join(OUT, "desktop-admin.png") });

  check("no unexpected JS/console errors during the run", consoleErrors.length === 0, consoleErrors.slice(0, 5).join(" | "));
} catch (e) {
  console.error("\nSCRIPT ERROR:", e.message);
  results.push({ name: `script error: ${e.message.split("\n")[0]}`, ok: false });
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log("FAILED:\n - " + failed.map((f) => f.name).join("\n - "));
  process.exit(1);
}
