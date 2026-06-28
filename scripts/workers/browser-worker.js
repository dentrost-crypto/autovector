const fs = require("fs");
const path = require("path");

process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY ||= "1";

let chromium;

try {
  ({ chromium } = require("playwright"));
} catch (error) {
  console.error("playwright is required. Install it with: npm install -D playwright");
  process.exit(1);
}

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const PUBLISH_RESULT_PATH = path.join(ROOT_DIR, "temp", "publish-result.json");

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

function loadPayload(payloadPath) {
  if (!payloadPath) return {};

  const absolutePath = resolveProjectPath(payloadPath);
  const raw = fs.readFileSync(absolutePath, "utf8");
  return JSON.parse(raw);
}

function writeJson(filePath, data) {
  ensureParentDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function normalizeAction(action) {
  return String(action || "")
    .trim()
    .replace(/[\s_-]+([a-z])/g, (_, letter) => letter.toUpperCase());
}

function slugify(value) {
  return String(value || "browser-worker")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    || "browser-worker";
}

function getStepTimeout(step, scenario) {
  return step.timeout ?? scenario.timeout ?? 15000;
}

function getScenarioBrowserOptions(scenario) {
  return {
    ...(scenario.browser || {}),
    ...(scenario.headless !== undefined ? { headless: scenario.headless } : {}),
    ...(scenario.slowMo !== undefined ? { slowMo: scenario.slowMo } : {}),
    ...(scenario.viewport !== undefined ? { viewport: scenario.viewport } : {}),
    ...(scenario.profileDir !== undefined ? { profileDir: scenario.profileDir } : {}),
  };
}

class BrowserWorker {
  constructor(options = {}) {
    this.options = options;
    this.defaultTimeout = options.timeout || 15000;
    this.defaultWaitUntil = options.waitUntil || "domcontentloaded";
    this.payload = options.payload || {};
    this.confirmPublish = options.confirmPublish === true;
    this.browser = null;
    this.context = null;
    this.page = null;
    this.results = {};
  }

  getPayloadValue(key) {
    if (!key) return "";

    return String(key)
      .split(".")
      .reduce((value, part) => (value && value[part] !== undefined ? value[part] : ""), this.payload);
  }

  resolvePayloadReferences(step) {
    const resolvedStep = { ...step };

    if (step.textFromPayload) {
      resolvedStep.text = this.getPayloadValue(step.textFromPayload);
    }

    if (step.valueFromPayload) {
      resolvedStep.value = this.getPayloadValue(step.valueFromPayload);
    }

    if (step.pathFromPayload) {
      resolvedStep.path = this.getPayloadValue(step.pathFromPayload);
    }

    if (step.urlFromPayload) {
      resolvedStep.url = this.getPayloadValue(step.urlFromPayload);
    }

    return resolvedStep;
  }

  async launch(step = {}) {
    if (this.browser) return;

    const browserOptions = {
      headless: step.headless ?? this.options.headless ?? true,
      slowMo: step.slowMo ?? this.options.slowMo ?? 0,
    };
    const viewport = step.viewport || this.options.viewport || { width: 1440, height: 1000 };

    if (this.options.profileDir) {
      const profileDir = resolveProjectPath(this.options.profileDir);
      console.log(`[BrowserWorker] using persistent profile: ${this.options.profileDir}`);
      ensureParentDir(path.join(profileDir, ".keep"));

      this.context = await chromium.launchPersistentContext(profileDir, {
        ...browserOptions,
        acceptDownloads: true,
        viewport,
      });
      this.browser = null;
    } else {
      this.browser = await chromium.launch(browserOptions);
      this.context = await this.browser.newContext({
        acceptDownloads: true,
        viewport,
      });
    }

    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(step.timeout || this.defaultTimeout);
    this.page.setDefaultNavigationTimeout(step.timeout || this.defaultTimeout);
  }

  async ensurePage() {
    if (!this.page) {
      await this.launch();
    }
  }

  async openUrl(step) {
    await this.ensurePage();
    if (!step.url) throw new Error("openUrl requires url");

    const startedAt = Date.now();
    await this.page.goto(step.url, {
      waitUntil: step.waitUntil || this.defaultWaitUntil,
      timeout: step.timeout || this.defaultTimeout,
    });
    console.log(`[BrowserWorker] opened URL in ${Date.now() - startedAt}ms`);
  }

  async wait(step) {
    await this.ensurePage();

    if (step.selector) {
      await this.waitForSelector(step);
      return;
    }

    await this.page.waitForTimeout(step.ms || 1000);
  }

  async waitForSelector(step) {
    await this.ensurePage();
    if (!step.selector) throw new Error("waitForSelector requires selector");

    await this.page.locator(step.selector).first().waitFor({
      state: step.state || "visible",
      timeout: step.timeout || this.defaultTimeout,
    });
  }

  async click(step) {
    await this.ensurePage();
    if (!step.selector) throw new Error("click requires selector");

    await this.page.locator(step.selector).first().click({
      timeout: step.timeout || this.defaultTimeout,
    });
  }

  async clickNth(step) {
    await this.ensurePage();
    if (!step.selector) throw new Error("clickNth requires selector");

    const index = Number(step.index || 0);

    await this.page.locator(step.selector).nth(index).click({
      timeout: step.timeout || this.defaultTimeout,
    });
  }

  async clickText(step) {
    await this.ensurePage();
    if (!step.text) throw new Error("clickText requires text");

    await this.page.getByText(String(step.text), {
      exact: step.exact ?? false,
    }).first().click({
      timeout: step.timeout || this.defaultTimeout,
    });
  }

  async clickAllText(step) {
    await this.ensurePage();
    if (!step.text) throw new Error("clickAllText requires text");

    const maxClicks = Number(step.maxClicks || 10);
    let clicked = 0;

    for (let attempt = 0; attempt < maxClicks; attempt += 1) {
      const locator = this.page.getByText(String(step.text), {
        exact: step.exact ?? true,
      });
      const count = await locator.count();
      let clickedOnAttempt = false;

      for (let index = 0; index < count; index += 1) {
        const item = locator.nth(index);

        try {
          if (!(await item.isVisible({ timeout: 500 }))) continue;

          await item.click({ timeout: step.timeout || this.defaultTimeout });
          clicked += 1;
          clickedOnAttempt = true;
          await this.page.waitForTimeout(step.delayAfterClick || 300);
          break;
        } catch (error) {
          // Continue looking for another visible matching element.
        }
      }

      if (!clickedOnAttempt) break;
    }

    console.log(`[BrowserWorker] clickAllText clicked ${clicked} element(s): ${step.text}`);
  }

  async clickRole(step) {
    await this.ensurePage();
    if (!step.role) throw new Error("clickRole requires role");

    const options = {};
    if (step.name !== undefined) {
      options.name = step.name;
    }
    if (step.exact !== undefined) {
      options.exact = step.exact;
    }

    await this.page.getByRole(step.role, options).first().click({
      timeout: step.timeout || this.defaultTimeout,
    });
  }

  async fill(step) {
    await this.ensurePage();
    if (!step.selector) throw new Error("fill requires selector");

    await this.page.locator(step.selector).first().fill(String(step.text ?? step.value ?? ""), {
      timeout: step.timeout || this.defaultTimeout,
    });
  }

  async type(step) {
    await this.ensurePage();
    if (!step.selector) {
      await this.page.keyboard.type(String(step.text || ""), {
        delay: step.delay || 0,
      });
      return;
    }

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
      timeout: step.timeout || this.defaultTimeout,
    });
  }

  async press(step) {
    await this.ensurePage();
    if (!step.key) throw new Error("press requires key");

    await this.page.keyboard.press(String(step.key), {
      delay: step.delay || 0,
    });
  }

  async uploadFile(step) {
    await this.ensurePage();
    if (!step.path) throw new Error("uploadFile requires path");

    const filePath = resolveProjectPath(step.path);
    const selector = step.selector || "input[type='file']";

    console.log(`[BrowserWorker] upload file path: ${filePath}`);

    await this.page.locator(selector).first().setInputFiles(filePath);
  }

  async downloadFile(step) {
    await this.ensurePage();
    if (!step.selector) throw new Error("downloadFile requires selector");
    if (!step.path) throw new Error("downloadFile requires path");

    const targetPath = resolveProjectPath(step.path);
    ensureParentDir(targetPath);

    const [download] = await Promise.all([
      this.page.waitForEvent("download", { timeout: step.timeout || this.defaultTimeout }),
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
      timeout: step.timeout || this.defaultTimeout,
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
      timeout: step.timeout || this.defaultTimeout,
    });

    if (step.saveAs) {
      this.results[step.saveAs] = targetPath;
    }
  }

  async takeNamedScreenshot(fileName) {
    await this.ensurePage();
    const targetPath = resolveProjectPath(`screenshots/${fileName}`);
    ensureParentDir(targetPath);

    await this.page.screenshot({
      path: targetPath,
      fullPage: false,
      timeout: 5000,
    });

    console.log(`[BrowserWorker] screenshot: ${targetPath}`);
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

  async clickFirstText(candidates, timeout) {
    for (const text of candidates) {
      const locator = this.page.getByText(text, { exact: true }).first();

      try {
        await locator.waitFor({ state: "visible", timeout: Math.min(timeout, 5000) });
        await locator.click({ timeout });
        console.log(`[BrowserWorker] clicked text: ${text}`);
        return text;
      } catch (error) {
        console.log(`[BrowserWorker] text not available: ${text}`);
      }
    }

    throw new Error(`None of these buttons were found: ${candidates.join(", ")}`);
  }

  async capturePublishedUrl() {
    await this.ensurePage();

    try {
      const currentUrl = this.page.url();
      const currentMatch = currentUrl.match(/(?:wall|w=wall)(-?\d+_\d+)/);

      if (currentMatch) {
        return `https://vk.com/wall${currentMatch[1]}`;
      }

      const hrefs = await this.page.locator("a[href*='wall']").evaluateAll((links) =>
        links
          .map((link) => link.href || link.getAttribute("href") || "")
          .filter(Boolean),
      );

      for (const href of hrefs) {
        const match = href.match(/(?:wall|w=wall)(-?\d+_\d+)/);
        if (match) {
          return `https://vk.com/wall${match[1]}`;
        }
      }
    } catch (error) {
      console.log(`[BrowserWorker] published URL capture failed: ${error.message}`);
    }

    return null;
  }

  async publishVkPost(step) {
    await this.ensurePage();

    if (!this.confirmPublish) {
      throw new Error("publishVkPost requires scenario.confirmPublish === true");
    }

    console.log("[BrowserWorker] publishVkPost confirmed by scenario.confirmPublish=true");
    await this.takeNamedScreenshot("vk-publish-before-next.png");

    await this.clickFirstText(["Далее"], step.timeout || this.defaultTimeout);
    await this.page.waitForTimeout(step.afterNextWaitMs || 2000);
    await this.takeNamedScreenshot("vk-publish-before-final.png");

    const publishButton = await this.clickFirstText(
      ["Опубликовать сейчас", "Опубликовать", "Разместить"],
      step.timeout || this.defaultTimeout,
    );

    console.log(`[BrowserWorker] VK publish button clicked: ${publishButton}`);
    await this.page.waitForTimeout(step.afterPublishWaitMs || 5000);
    await this.takeNamedScreenshot("vk-publish-after-final.png");

    const publishedUrl = await this.capturePublishedUrl();
    const publishedAt = new Date().toISOString();

    this.results.publishedUrl = publishedUrl;
    this.results.publishedAt = publishedAt;

    const publishResult = {
      ok: true,
      id: this.payload.id || null,
      platform: this.payload.platform || "vk",
      publishedUrl,
      publishedAt,
    };

    writeJson(PUBLISH_RESULT_PATH, publishResult);
    console.log(`[BrowserWorker] publish result written to ${path.relative(ROOT_DIR, PUBLISH_RESULT_PATH)}`);

    return publishResult;
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
    const resolvedStep = this.resolvePayloadReferences(step);
    const action = normalizeAction(resolvedStep.action);

    switch (action) {
      case "launch":
      case "launchBrowser":
        return this.launch(resolvedStep);
      case "openUrl":
      case "open":
        return this.openUrl(resolvedStep);
      case "wait":
        return this.wait(resolvedStep);
      case "waitForSelector":
        return this.waitForSelector(resolvedStep);
      case "click":
      case "clickElement":
        return this.click(resolvedStep);
      case "clickNth":
      case "clickSelectorAll":
        return this.clickNth(resolvedStep);
      case "clickText":
      case "clickByText":
        return this.clickText(resolvedStep);
      case "clickAllText":
        return this.clickAllText(resolvedStep);
      case "clickRole":
      case "clickByRole":
        return this.clickRole(resolvedStep);
      case "fill":
      case "fillText":
        return this.fill(resolvedStep);
      case "type":
      case "typeText":
        return this.type(resolvedStep);
      case "press":
      case "pressKey":
        return this.press(resolvedStep);
      case "uploadFile":
        return this.uploadFile(resolvedStep);
      case "downloadFile":
        return this.downloadFile(resolvedStep);
      case "readText":
        return this.readText(resolvedStep);
      case "takeScreenshot":
      case "screenshot":
        return this.takeScreenshot(resolvedStep);
      case "scroll":
        return this.scroll(resolvedStep);
      case "publishVkPost":
        return this.publishVkPost(resolvedStep);
      case "close":
      case "closeBrowser":
        return this.close();
      default:
        throw new Error(`Unsupported browser worker action: ${resolvedStep.action}`);
    }
  }

  async runScenario(scenario) {
    const steps = Array.isArray(scenario.steps) ? scenario.steps : [];
    this.defaultTimeout = scenario.timeout || this.defaultTimeout;
    this.defaultWaitUntil = scenario.waitUntil || this.defaultWaitUntil;

    if (steps.length === 0) {
      throw new Error("Browser Worker scenario must contain steps[]");
    }

    for (const [index, step] of steps.entries()) {
      const stepNumber = index + 1;
      const action = step.action || "unknown";
      const stepWithTimeout = {
        ...step,
        timeout: getStepTimeout(step, scenario),
      };
      const startedAt = Date.now();

      console.log(`[BrowserWorker] ${stepNumber}/${steps.length} ${action} start`);

      try {
        await this.runStep(stepWithTimeout);
        console.log(`[BrowserWorker] ${stepNumber}/${steps.length} ${action} done in ${Date.now() - startedAt}ms`);

        if (scenario.screenshotAfterStep && this.page && this.context && normalizeAction(action) !== "close") {
          const scenarioName = slugify(scenario.name);
          const screenshotPath = resolveProjectPath(
            `screenshots/browser-worker-steps/${scenarioName}-step-${String(stepNumber).padStart(2, "0")}.png`,
          );
          ensureParentDir(screenshotPath);
          try {
            await this.page.screenshot({
              path: screenshotPath,
              fullPage: false,
              timeout: Math.min(stepWithTimeout.timeout, 5000),
            });
          } catch (screenshotError) {
            console.warn(
              `[BrowserWorker] step screenshot failed for ${stepNumber}/${steps.length}: ${screenshotError.message}`,
            );
          }
        }
      } catch (error) {
        error.browserWorkerStep = {
          number: stepNumber,
          action,
          selector: step.selector,
          url: step.url,
        };
        throw error;
      }
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
  const payload = loadPayload(scenario.payload);
  const worker = new BrowserWorker({
    ...getScenarioBrowserOptions(scenario),
    timeout: scenario.timeout || 15000,
    waitUntil: scenario.waitUntil || "domcontentloaded",
    payload,
    confirmPublish: scenario.confirmPublish === true,
  });

  try {
    const results = await worker.runScenario(scenario);
    console.log(JSON.stringify({ ok: true, results }, null, 2));
  } catch (error) {
    const failedStep = error.browserWorkerStep || {};
    console.error(`[BrowserWorker] failed step number: ${failedStep.number || "unknown"}`);
    console.error(`[BrowserWorker] action: ${failedStep.action || "unknown"}`);
    if (failedStep.selector) console.error(`[BrowserWorker] selector: ${failedStep.selector}`);
    if (failedStep.url) console.error(`[BrowserWorker] url: ${failedStep.url}`);
    console.error(`[BrowserWorker] error: ${error.message}`);

    if (worker.page) {
      try {
        const errorScreenshotPath = resolveProjectPath("screenshots/browser-worker-error.png");
        ensureParentDir(errorScreenshotPath);
        await worker.page.screenshot({
          path: errorScreenshotPath,
          fullPage: true,
          timeout: 5000,
        });
        console.error(`[BrowserWorker] error screenshot: ${errorScreenshotPath}`);
      } catch (screenshotError) {
        console.error(`[BrowserWorker] error screenshot failed: ${screenshotError.message}`);
      }
    }

    process.exitCode = 1;
  } finally {
    if (scenario.pause && process.exitCode !== 1) {
      console.log("Browser left open for inspection.");
    } else {
      await worker.close();
    }
  }
}

if (require.main === module) {
  runFromCli();
}

module.exports = {
  BrowserWorker,
  getScenarioBrowserOptions,
};
