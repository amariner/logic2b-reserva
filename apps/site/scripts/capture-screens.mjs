#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import {
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repo = resolve(scriptDir, "../../..");
const outputParent = join(repo, "apps/site/public/images");
const outputDir = join(outputParent, "screens");
const origin = process.env.CAPTURE_ORIGIN ?? "http://127.0.0.1:8791";
const fixedNow = "2026-08-18T10:00:00+02:00";
const allowedOrigin = new URL(origin).origin;
const externallyManagedOrigin = Boolean(process.env.CAPTURE_ORIGIN);
const viewports = [
  { id: "desktop", width: 1366, height: 900 },
  { id: "mobile", width: 375, height: 812 },
];

const scenes = [
  {
    order: "01",
    id: "brasca-marca",
    brand: "brasca",
    route: "/demos/brasca/",
    state: "Hero y propuesta del plan Básico en estado inicial",
    async prepare(page) {
      await page.locator("#brasca-hero-title").waitFor({ state: "visible" });
      await page.evaluate(() => window.scrollTo(0, 0));
    },
  },
  {
    order: "02",
    id: "brasca-solicitud",
    brand: "brasca",
    route: "/demos/brasca/",
    state: "Solicitud por email explicada y formulario vacío sin envío",
    captureOffset: { mobile: -65 },
    async prepare(page) {
      const section = page.locator("#reserva");
      await section.waitFor({ state: "visible" });
      await section.scrollIntoViewIfNeeded();
    },
  },
  {
    order: "03",
    id: "vedra-reserva",
    brand: "vedra",
    route: "/demos/vedra/",
    state: "Horario y menú de grupo seleccionados sin confirmar datos",
    async prepare(page) {
      const widget = page.locator("[data-booking-widget]");
      await widget.waitFor({ state: "visible" });
      await widget.locator('select[name="partySize"]').selectOption("8");
      await widget.getByRole("button", { name: "Continuar" }).click();
      await widget.locator(".vw-times button").first().click();
      await widget.getByRole("button", { name: "Continuar" }).click();
      await widget
        .locator('input[name="menuId"][value="vedra-grupos"]')
        .check();
      await widget.scrollIntoViewIfNeeded();
      assert.equal(
        await widget
          .locator('input[name="menuId"][value="vedra-grupos"]')
          .isChecked(),
        true,
      );
    },
  },
  {
    order: "04",
    id: "vedra-grupo",
    brand: "vedra",
    route: "/demos/vedra/gestion/?vista=plano",
    state: "Familia Ortega con VS4+VS5 y menú de grupo preparados",
    captureOffset: { mobile: -72 },
    async prepare(page) {
      await page.locator('[data-tour-mode="guided"]').click();
      await page
        .getByRole("button", { name: "Proponer combinaciones" })
        .click();
      await page.locator('[data-table-combination="vs4+vs5"]').click();
      await page.locator(".rd-menu-select select").selectOption("vedra-grupos");
      assert.equal(
        await page.locator('[data-table-id="vs4"]').getAttribute("data-state"),
        "selected",
      );
      assert.equal(
        await page.locator('[data-table-id="vs5"]').getAttribute("data-state"),
        "selected",
      );
      await page.locator(".rd-journey").scrollIntoViewIfNeeded();
    },
  },
  {
    order: "05",
    id: "solane-inventario",
    brand: "solane",
    route: "/demos/solane/gestion/?vista=plano",
    state: "Cena maridaje publicada y mesas SS7+SS8 bloqueadas",
    async prepare(page) {
      await navigate(page, "/demos/solane/gestion/?vista=eventos");
      const event = page.locator('[data-manager-event-id="solane-maridaje"]');
      await event.locator("[data-publish-event]").click();
      assert.equal(
        await event.getAttribute("data-manager-event-status"),
        "published",
      );
      await navigate(page, "/demos/solane/gestion/?vista=plano");
      const firstTable = page.locator('[data-table-id="ss7"]');
      const secondTable = page.locator('[data-table-id="ss8"]');
      await firstTable.waitFor({ state: "visible" });
      assert.equal(await firstTable.getAttribute("data-state"), "event");
      assert.equal(await secondTable.getAttribute("data-state"), "event");
      await firstTable.scrollIntoViewIfNeeded();
    },
  },
  {
    order: "06",
    id: "solane-deposito",
    brand: "solane",
    route: "/demos/solane/",
    state: "Depósito proporcional revisado en pasarela simulada",
    async prepare(page) {
      const widget = page.locator("[data-solane-booking-widget]");
      await widget.locator('select[name="partySize"]').selectOption("4");
      await widget.getByRole("button", { name: "Continuar" }).click();
      await widget.locator('[data-time="21:00"]').click();
      await widget.getByRole("button", { name: "Continuar" }).click();
      await widget
        .locator('input[name="menuId"][value="solane-degustacion"]')
        .check();
      await widget.getByRole("button", { name: "Continuar" }).click();
      await widget.locator('input[name="name"]').fill("Lucía Serra");
      await widget.locator('input[name="email"]').fill("lucia@example.test");
      await widget.locator('input[name="depositTerms"]').check();
      await widget
        .getByRole("button", { name: "Confirmar experiencia demo" })
        .click();
      const gateway = page.locator("[data-deposit-gateway]");
      await gateway.waitFor({ state: "visible" });
      assert.match(await gateway.innerText(), /50%/);
      assert.match(await gateway.innerText(), /250,00/);
    },
  },
  {
    order: "07",
    id: "solane-privatizacion",
    brand: "solane",
    route: "/demos/solane/gestion/?vista=privatizaciones",
    state: "Privado bloqueado después de propuesta y señal simulada",
    captureOffset: { desktop: -24, mobile: 210 },
    capturePadding: { mobile: 85 },
    async prepare(page) {
      await page.locator('[data-private-tour-mode="guided"]').click();
      const hire = page.locator('[data-private-hire-id="solane-hire-1"]');
      await page.locator("[data-prepare-private-hire]").click();
      await page.locator("[data-register-private-deposit]").click();
      await page.locator("[data-block-private-hire]").click();
      assert.equal(
        await hire.getAttribute("data-private-hire-status"),
        "blocked",
      );
      const complete = page.locator("[data-private-tour-complete]");
      await complete.waitFor({ state: "visible" });
      await complete.scrollIntoViewIfNeeded();
    },
  },
  {
    order: "08",
    id: "solane-riesgo",
    brand: "solane",
    route: "/demos/solane/gestion/?vista=informes",
    state: "Marc y Lucía priorizados con score y señales explicables",
    captureOffset: { desktop: 232, mobile: -34 },
    capturePadding: { desktop: 84 },
    async prepare(page) {
      const board = page.locator("[data-no-show-risk-board]");
      await board.waitFor({ state: "visible" });
      assert.equal(
        await board
          .locator('[data-risk-booking="sol-r2"] [data-risk-score]')
          .innerText(),
        "80/100",
      );
      assert.equal(
        await board
          .locator('[data-risk-booking="sol-r1"] [data-risk-score]')
          .innerText(),
        "30/100",
      );
      await board.scrollIntoViewIfNeeded();
    },
  },
];

const captureStyles = `
  *, *::before, *::after {
    animation: none !important;
    caret-color: transparent !important;
    scroll-behavior: auto !important;
    transition: none !important;
  }
  html { scrollbar-width: none !important; }
  ::-webkit-scrollbar { display: none !important; }
  .demo-notice {
    position: sticky !important;
    z-index: 999 !important;
    top: 0 !important;
  }
  .demo-notice + header { top: 34px !important; }
`;

await mkdir(outputParent, { recursive: true });
const temporaryDir = await mkdtemp(join(outputParent, ".screens-next-"));
const backupDir = join(outputParent, ".screens-previous");
const manifest = {
  version: 1,
  locale: "es-ES",
  fixedNow,
  captures: [],
};
let server;
let browser;

try {
  if (!externallyManagedOrigin) {
    await assertOriginFree();
    server = startServer();
    await waitForServer(server);
  } else {
    await waitForOrigin();
  }

  const executablePath = [
    process.env.CHROMIUM_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ]
    .filter(Boolean)
    .find((candidate) => existsSync(candidate));
  browser = await chromium.launch(
    executablePath ? { executablePath } : undefined,
  );

  const jobs = scenes.flatMap((scene) =>
    viewports.map((viewport) => ({ scene, viewport })),
  );
  // El render concurrente de dos viewports de la misma escena puede variar el
  // rasterizado de AVIF en Chrome. El catálogo es pequeño y su contrato exige
  // hashes reproducibles, así que se captura estrictamente en orden.
  const captures = await mapConcurrent(jobs, 1, ({ scene, viewport }) =>
    captureScene(browser, scene, viewport, temporaryDir),
  );
  manifest.captures.push(...captures);
  for (const capture of captures) {
    console.log(
      `[fotos] ${capture.file} · ${capture.width}×${capture.height} · ${capture.sha256.slice(0, 12)}`,
    );
  }

  assert.equal(manifest.captures.length, scenes.length * viewports.length);
  assert.equal(
    new Set(manifest.captures.map((capture) => capture.file)).size,
    manifest.captures.length,
  );
  await writeFile(
    join(temporaryDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );

  await rm(backupDir, { recursive: true, force: true });
  if (existsSync(outputDir)) await rename(outputDir, backupDir);
  try {
    await rename(temporaryDir, outputDir);
  } catch (error) {
    if (existsSync(backupDir) && !existsSync(outputDir))
      await rename(backupDir, outputDir);
    throw error;
  }
  await rm(backupDir, { recursive: true, force: true });
  console.log(
    `[fotos] paquete completo · ${manifest.captures.length} PNG · ${outputDir}`,
  );
} catch (error) {
  const serverFailure = server?.exitCode !== null ? server?.logs?.trim() : "";
  if (serverFailure) {
    throw new Error(
      `${error instanceof Error ? error.message : String(error)}\n\nWorker local:\n${serverFailure.slice(-4_000)}`,
      { cause: error },
    );
  }
  throw error;
} finally {
  if (browser) await browser.close().catch(() => undefined);
  if (server) await stopServer(server);
  await rm(temporaryDir, { recursive: true, force: true });
}

async function captureScene(activeBrowser, scene, viewport, targetDir) {
  const context = await activeBrowser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    locale: "es-ES",
    timezoneId: "Europe/Madrid",
    colorScheme: "light",
    reducedMotion: "reduce",
    serviceWorkers: "block",
  });
  const violations = [];

  try {
    await context.addInitScript(
      ({ now }) => {
        const NativeDate = Date;
        const timestamp = NativeDate.parse(now);
        class FixedDate extends NativeDate {
          constructor(...args) {
            super(...(args.length === 0 ? [timestamp] : args));
          }
          static now() {
            return timestamp;
          }
        }
        Object.defineProperty(globalThis, "Date", { value: FixedDate });
      },
      { now: fixedNow },
    );

    await context.route("**/*", async (route) => {
      const request = route.request();
      const method = request.method();
      const url = request.url();
      const requestOrigin = url.startsWith("http")
        ? new URL(url).origin
        : allowedOrigin;
      if (
        !["GET", "HEAD"].includes(method) ||
        requestOrigin !== allowedOrigin
      ) {
        violations.push(`petición prohibida: ${method} ${url}`);
        await route.abort("blockedbyclient");
        return;
      }
      await route.continue();
    });

    const page = await context.newPage();
    page.on("console", (message) => {
      if (message.type() === "error")
        violations.push(`console: ${message.text()}`);
    });
    page.on("pageerror", (error) =>
      violations.push(`página: ${error.message}`),
    );
    page.on("response", (response) => {
      if (response.status() >= 400)
        violations.push(`respuesta: ${response.status()} ${response.url()}`);
    });
    page.on("requestfailed", (request) => {
      const failure = request.failure()?.errorText ?? "desconocido";
      if (
        !failure.includes("ERR_ABORTED") &&
        !failure.includes("BLOCKED_BY_CLIENT")
      ) {
        violations.push(`recurso: ${request.url()} (${failure})`);
      }
    });

    await context.clearCookies();
    await navigate(page, scene.route);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: "networkidle" });
    await scene.prepare(page);
    await settle(page);
    await page.addStyleTag({ content: captureStyles });
    const capturePadding = scene.capturePadding?.[viewport.id] ?? 0;
    if (capturePadding > 0) {
      await page.evaluate((padding) => {
        document.body.style.paddingBottom = `${padding}px`;
      }, capturePadding);
    }
    const captureOffset = scene.captureOffset?.[viewport.id] ?? 0;
    if (captureOffset !== 0) {
      await page.evaluate(
        (offset) => window.scrollBy(0, offset),
        captureOffset,
      );
    }
    await page.waitForTimeout(50);

    const checks = await page.evaluate(() => {
      const notice = document.querySelector(".demo-notice");
      const noticeBox = notice?.getBoundingClientRect();
      const visibleText = document.body.innerText;
      const emails =
        visibleText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
      return {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
        overflow:
          Math.max(
            document.documentElement.scrollWidth,
            document.body.scrollWidth,
          ) - document.documentElement.clientWidth,
        notice: notice?.textContent?.trim() ?? "",
        noticeVisible: Boolean(
          noticeBox &&
          noticeBox.top >= -1 &&
          noticeBox.bottom <= innerHeight + 1,
        ),
        forbiddenRecipient: visibleText.includes(
          "marinerandreu+logic@gmail.com",
        ),
        unexpectedEmails: emails.filter(
          (email) =>
            !email.toLowerCase().endsWith(".test") &&
            !email.toLowerCase().endsWith(".invalid"),
        ),
        imagesReady: [...document.images].every(
          (image) => image.complete && image.naturalWidth > 0,
        ),
      };
    });

    assert.deepEqual(
      { width: checks.width, height: checks.height },
      { width: viewport.width, height: viewport.height },
    );
    assert.ok(
      checks.overflow <= 1,
      `overflow horizontal de ${checks.overflow}px`,
    );
    assert.match(checks.notice, /Demostración ficticia/);
    assert.equal(
      checks.noticeVisible,
      true,
      "la etiqueta ficticia no está visible",
    );
    assert.equal(checks.forbiddenRecipient, false, "destinatario real visible");
    assert.deepEqual(
      checks.unexpectedEmails,
      [],
      `correos fuera de allowlist: ${checks.unexpectedEmails.join(", ")}`,
    );
    assert.equal(checks.imagesReady, true, "hay imágenes incompletas");
    assert.deepEqual(violations, []);

    const file = `${scene.order}-${scene.id}-${viewport.id}.png`;
    const path = join(targetDir, file);
    await page.screenshot({ path, fullPage: false, animations: "disabled" });
    const buffer = await readFile(path);
    const dimensions = pngDimensions(buffer);
    const fileStat = await stat(path);
    assert.deepEqual(dimensions, {
      width: viewport.width,
      height: viewport.height,
    });
    assert.ok(
      fileStat.size > 10_000,
      `${file} parece vacío (${fileStat.size} bytes)`,
    );

    return {
      order: scene.order,
      id: scene.id,
      brand: scene.brand,
      route: scene.route,
      state: scene.state,
      viewport: viewport.id,
      width: viewport.width,
      height: viewport.height,
      file,
      sha256: createHash("sha256").update(buffer).digest("hex"),
    };
  } catch (error) {
    throw new Error(
      `${scene.order}-${scene.id}-${viewport.id}: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    await context.close();
  }
}

async function mapConcurrent(items, limit, operation) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (nextIndex < items.length) {
        const index = nextIndex;
        nextIndex += 1;
        results[index] = await operation(items[index], index);
      }
    },
  );
  await Promise.all(workers);
  return results;
}

async function navigate(page, route) {
  await page.goto(`${origin}${route}`, { waitUntil: "networkidle" });
  await settle(page);
}

async function settle(page) {
  await page.waitForLoadState("domcontentloaded");
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map((image) => {
        if (image.complete) return undefined;
        return new Promise((resolveImage) => {
          image.addEventListener("load", resolveImage, { once: true });
          image.addEventListener("error", resolveImage, { once: true });
        });
      }),
    );
  });
  await page.waitForTimeout(80);
}

function pngDimensions(buffer) {
  const signature = "89504e470d0a1a0a";
  assert.equal(
    buffer.subarray(0, 8).toString("hex"),
    signature,
    "PNG inválido",
  );
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function startServer() {
  const executable = join(repo, "node_modules/.bin/wrangler");
  assert.ok(
    existsSync(executable),
    "Falta Wrangler local. Ejecuta pnpm install antes de pnpm fotos.",
  );
  const child = spawn(
    executable,
    [
      "dev",
      "--config",
      "wrangler.jsonc",
      "--ip",
      "127.0.0.1",
      "--port",
      "8791",
      "--inspector-port",
      "9234",
    ],
    {
      cwd: join(repo, "apps/worker"),
      env: {
        CI: "true",
        LANG: process.env.LANG ?? "en_US.UTF-8",
        NO_UPDATE_NOTIFIER: "1",
        PATH: process.env.PATH,
        TMPDIR: process.env.TMPDIR,
        WRANGLER_LOG_PATH: "/tmp/logic-reserva-captures-wrangler.log",
        WRANGLER_SEND_METRICS: "false",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  child.logs = "";
  child.stdout.on("data", (chunk) => {
    child.logs += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    child.logs += chunk.toString();
  });
  return child;
}

async function assertOriginFree() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 600);
  try {
    const response = await fetch(origin, { signal: controller.signal });
    if (response)
      throw new Error(
        `${origin} ya está ocupado; detén el servidor anterior o usa CAPTURE_ORIGIN.`,
      );
  } catch (error) {
    if (error instanceof Error && error.message.includes("ya está ocupado"))
      throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function waitForServer(child) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 60_000) {
    if (child.exitCode !== null)
      throw new Error(
        `Wrangler terminó antes de servir el bundle:\n${child.logs}`,
      );
    if (await originResponds()) return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw new Error(`Wrangler no respondió en 60 s:\n${child.logs}`);
}

async function waitForOrigin() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 15_000) {
    if (await originResponds()) return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw new Error(`${origin} no responde.`);
}

async function originResponds() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 500);
  try {
    const response = await fetch(origin, { signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function stopServer(child) {
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolveExit) => child.once("exit", resolveExit)),
    new Promise((resolveWait) => setTimeout(resolveWait, 5_000)),
  ]);
  if (child.exitCode === null) child.kill("SIGKILL");
}
