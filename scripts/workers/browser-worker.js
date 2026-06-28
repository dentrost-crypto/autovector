const fs = require("fs");
const path = require("path");

let chromium;

try {
  ({ chromium } = require("playwright"));
} catch (error) {
  console.error("playwright is required. Install it with: npm install -D playwright");
  process.exit(1);
}

const ROOT_DIR = path.resolve(__dirname, "..", "..");

function resolveProjectPath(filePath) {
  if (!filePath) return "";
  return path.isAbsolute(filePath) ? filePath : path.join(ROOT_DIR, filePath);
}

function ensureParentDir(filePath) {
  const parentDir = path.dirname(filePath);
  fs.mkdirSync(parentDir, { recursive: true });
}

function loadScenario(scenarioPath) {
  const absolutePath = resolveProjectPath(scenarioPath);
  const raw = fs.readFileSync(absolutePath, "utf8");
  return JSON.parse(raw);
}

function normalizeAction(action) {
  return String(action || "")
    .trim()
    .replace(/[\s_-]+([a-z])/g, (_, letter) => letter.toUpperCase());
}

class BrowserWorker {
  constructor(options = {}) {
    this.options = options;
    this.browser = null;
    this.context = null;
    this.page = null;
    this.results = {};
  }

  async launch(step = {}) {
    if (this.browser) return;

    const browserOptions = {
      headless: step.headless ?? this.options.headless ?? true,
      slowMo: step.slowMo ?? this.options.slowMo ?? 0,
    };

    this.browser = await chromium.launch(browserOptions);
    this.context = await this.browser.newContext({
      acceptDownloads: true,
      viewport: step.viewport || this.options.viewport || { width: 1440, height: 1000 },
    });
    this.page = await this.context.newPage();
  }

  async ensurePage() {
    if (!this.page) {
      await this.launch();
    }
  }

  async openUrl(step) {
    await this.ensurePage();
    if (!step.url) throw new Error("openUrl requires url");

    await this.page.goto(step.url, {
      waitUntil: step.waitUntil || "domcontentloaded",
      timeout: step.timeout || 60000,
    });
  }

  async wait(step) {
    await this.ensurePage();

    if (step.selector) {
      await this.page.waitForSelector(step.selector, {
        state: step.state || "visible",
        timeout: step.timeout || 30000,
      });
      return;
    }

    await this.page.waitForTimeout(step.ms || 1000);
  }

  async click(step) {
    await this.ensurePage();
    if (!step.selector) throw new Error("click requires selector");

    await this.page.locator(step.selector).first().click({
      timeout: step.timeout || 30000,
    });
  }

  async type(step) {
    await this.ensurePage();
    if (!step.selector) throw new Error("type requires selector");

    const locator = this.page.locator(step.selector).first();

    if (step.clear !== false) {
      await locator.fill("");
    }

    if (step.fill === true) {
      await locator.fill(String(step.text || ""));
      return;
    }

    await locator.type(String(step.text || ""), {
      delay: step.delay || 0,
    });
  }

  async uploadFile(step) {
    await this.ensurePage();
    if (!step.selector) throw new Error("uploadFile requires selector");
    if (!step.path) throw new Error("uploadFile requires path");

    await this.page.locator(step.selector).first().setInputFiles(resolveProjectPath(step.path));
  }

  async downloadFile(step) {
    await this.ensurePage();
    if (!step.selector) throw new Error("downloadFile requires selector");
    if (!step.path) throw new Error("downloadFile requires path");

    const targetPath = resolveProjectPath(step.path);
    ensureParentDir(targetPath);

    const [download] = await Promise.all([
      this.page.waitForEvent("download", { timeout: step.timeout || 60000 }),
      this.page.locator(step.selector).first().click(),
    ]);

    await download.saveAs(targetPath);

    if (step.saveAs) {
      this.results[step.saveAs] = targetPath;
    }
  }

  async readText(step) {
    await this.ensurePage();
    const selector = step.selector || "body";
    const text = await this.page.locator(selector).first().innerText({
      timeout: step.timeout || 30000,
    });

    if (step.saveAs) {
      this.results[step.saveAs] = text;
    }

    return text;
  }

  async takeScreenshot(step) {
    await this.ensurePage();
    const targetPath = resolveProjectPath(step.path || "AMOS/public/screenshots/browser-worker.png");
    ensureParentDir(targetPath);

    await this.page.screenshot({
      path: targetPath,
      fullPage: step.fullPage ?? false,
    });

    if (step.saveAs) {
      this.results[step.saveAs] = targetPath;
    }
  }

  async scroll(step) {
    await this.ensurePage();
    const x = Number(step.x || 0);
    const y = Number(step.y || 0);

    await this.page.evaluate(
      ({ scrollX, scrollY }) => window.scrollBy(scrollX, scrollY),
      { scrollX: x, scrollY: y },
    );
  }

  async close() {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }

    this.page = null;
  }

  async runStep(step) {
    const action = normalizeAction(step.action);

    switch (action) {
      case "launch":
      case "launchBrowser":
        return this.launch(step);
      case "openUrl":
      case "open":
        return this.openUrl(step);
      case "wait":
        return this.wait(step);
      case "click":
      case "clickElement":
        return this.click(step);
      case "type":
      case "typeText":
        return this.type(step);
      case "uploadFile":
        return this.uploadFile(step);
      case "downloadFile":
        return this.downloadFile(step);
      case "readText":
        return this.readText(step);
      case "takeScreenshot":
      case "screenshot":
        return this.takeScreenshot(step);
      case "scroll":
        return this.scroll(step);
      case "close":
      case "closeBrowser":
        return this.close();
      default:
        throw new Error(`Unsupported browser worker action: ${step.action}`);
    }
  }

  async runScenario(scenario) {
    const steps = Array.isArray(scenario.steps) ? scenario.steps : [];

    if (steps.length === 0) {
      throw new Error("Browser Worker scenario must contain steps[]");
    }

    for (const [index, step] of steps.entries()) {
      console.log(`[BrowserWorker] ${index + 1}/${steps.length}: ${step.action}`);
      await this.runStep(step);
    }

    return this.results;
  }
}

async function runFromCli() {
  const scenarioPath = process.argv[2];

  if (!scenarioPath) {
    console.log("Usage: node scripts/workers/browser-worker.js <scenario.json>");
    console.log("Example: node scripts/workers/browser-worker.js AMOS/workflows/browser-example.json");
    return;
  }

  const scenario = loadScenario(scenarioPath);
  const worker = new BrowserWorker(scenario.browser || {});

  try {
    const results = await worker.runScenario(scenario);
    console.log(JSON.stringify({ ok: true, results }, null, 2));
  } catch (error) {
    console.error(`[BrowserWorker] failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await worker.close();
  }
}

if (require.main === module) {
  runFromCli();
}

module.exports = {
  BrowserWorker,
};
