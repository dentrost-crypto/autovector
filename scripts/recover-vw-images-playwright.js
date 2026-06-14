const fs = require("fs/promises");
const path = require("path");

const carsPath = path.join(process.cwd(), "app", "data", "cars.json");
const uploadsRoot = path.join(process.cwd(), "public", "uploads", "cars");
const MAX_IMAGES_PER_CAR = 4;
const MAX_REMOTE_ATTEMPTS_PER_CAR = 4;
const IMAGE_TIMEOUT_MS = 6000;
const ID_FROM = 47;
const ID_TO = 71;

const imageHeaders = {
  Referer: "https://korex-auto.com/",
  Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*",
};

function isVolkswagenRecoveryTarget(car) {
  const id = Number(car.id);
  return car.brand === "Volkswagen" || (id >= ID_FROM && id <= ID_TO);
}

function getRemoteImages(car) {
  const sources = [
    ...(Array.isArray(car.remoteImages) ? car.remoteImages : []),
    ...(Array.isArray(car.images) ? car.images : []),
    car.remoteImage,
    car.image,
  ].filter(
    (value) =>
      typeof value === "string" &&
      /^https?:\/\//i.test(value.trim()) &&
      !value.includes("fallback.svg"),
  );

  return Array.from(new Set(sources.map((source) => source.trim())));
}

async function loadDependencies() {
  let chromium;
  let sharp;

  try {
    ({ chromium } = require("playwright"));
  } catch (error) {
    throw new Error(
      "playwright is required. Install it with: npm install -D playwright",
    );
  }

  try {
    sharp = require("sharp");
  } catch (error) {
    throw new Error("sharp is required to convert recovered images to webp.");
  }

  return { chromium, sharp };
}

async function downloadImageWithBrowser(page, context, url) {
  try {
    const response = await page.goto(url, {
      waitUntil: "commit",
      timeout: IMAGE_TIMEOUT_MS,
    });

    if (response && response.ok()) {
      const contentType = response.headers()["content-type"] || "";
      if (contentType.startsWith("image/")) {
        return await response.body();
      }
    }
  } catch (error) {
    console.warn(`Browser page load failed: ${url} (${error.message})`);
  }

  const response = await context.request.get(url, {
    headers: imageHeaders,
    timeout: IMAGE_TIMEOUT_MS,
  });

  if (!response.ok()) {
    throw new Error(`HTTP ${response.status()} ${response.statusText()}`);
  }

  const contentType = response.headers()["content-type"] || "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Unexpected content-type: ${contentType || "unknown"}`);
  }

  return await response.body();
}

async function recoverCarImages({ car, page, context, sharp }) {
  const remoteImages = getRemoteImages(car);
  const carDir = path.join(uploadsRoot, String(car.id));
  const localImages = [];

  await fs.mkdir(carDir, { recursive: true });

  console.log(`Car ${car.id}: ${remoteImages.length} remote images found`);

  for (const [sourceIndex, url] of remoteImages.slice(0, MAX_REMOTE_ATTEMPTS_PER_CAR).entries()) {
    if (localImages.length >= MAX_IMAGES_PER_CAR) {
      break;
    }

    const fileName = `${localImages.length + 1}.webp`;
    const filePath = path.join(carDir, fileName);
    const publicPath = `/uploads/cars/${car.id}/${fileName}`;

    try {
      const buffer = await downloadImageWithBrowser(page, context, url);
      await sharp(buffer).webp({ quality: 90 }).toFile(filePath);
      localImages.push(publicPath);
      console.log(`Car ${car.id}: saved ${publicPath} from remote #${sourceIndex + 1}`);
    } catch (error) {
      console.warn(`Car ${car.id}: failed ${url} (${error.message})`);
    }
  }

  if (localImages.length === 0) {
    return { car, downloadedCount: 0 };
  }

  return {
    car: {
      ...car,
      image: localImages[0],
      images: localImages,
      remoteImages,
    },
    downloadedCount: localImages.length,
  };
}

async function main() {
  const { chromium, sharp } = await loadDependencies();
  const cars = JSON.parse(await fs.readFile(carsPath, "utf8"));
  const updatedCars = [];
  const targets = cars.filter(isVolkswagenRecoveryTarget);
  let totalDownloaded = 0;
  let restoredCars = 0;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    extraHTTPHeaders: imageHeaders,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(IMAGE_TIMEOUT_MS);
  page.setDefaultNavigationTimeout(IMAGE_TIMEOUT_MS);

  try {
    for (const car of cars) {
      if (!isVolkswagenRecoveryTarget(car)) {
        updatedCars.push(car);
        continue;
      }

      console.log(`Recovering car ${car.id} (${car.title})`);
      const result = await recoverCarImages({ car, page, context, sharp });
      updatedCars.push(result.car);
      totalDownloaded += result.downloadedCount;

      if (result.downloadedCount > 0) {
        restoredCars += 1;
      }
    }
  } finally {
    await browser.close();
  }

  await fs.writeFile(carsPath, `${JSON.stringify(updatedCars, null, 2)}\n`);

  const remainingWithoutPhotos = updatedCars.filter(
    (car) =>
      isVolkswagenRecoveryTarget(car) &&
      !String(car.image || "").startsWith("/uploads/cars/"),
  ).length;

  console.log(`Volkswagen targets: ${targets.length}`);
  console.log(`Downloaded photos: ${totalDownloaded}`);
  console.log(`Restored cars: ${restoredCars}`);
  console.log(`Remaining without photos: ${remainingWithoutPhotos}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
