const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const ENV_PATH = path.join(ROOT_DIR, ".env.local");
const CARS_PATH = path.join(ROOT_DIR, "app", "data", "cars.json");
const POSTED_PATH = path.join(ROOT_DIR, "app", "data", "posted-cars.json");
const SITE_URL = "https://www.autovector.pro";
const CNY_TO_RUB = 10.5;
const RUSSIA_DELIVERY_COST_RUB = 900000;

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=").trim().replace(/^['"]|['"]$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function parsePriceNumber(price) {
  if (typeof price === "number" && Number.isFinite(price)) {
    return price;
  }

  if (typeof price !== "string") {
    return 0;
  }

  const normalized = price.replace(/[^\d.,]/g, "").replace(",", ".");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatRubPrice(price) {
  return `${Math.round(price).toLocaleString("ru-RU")} ₽`;
}

function formatCnyPrice(price) {
  return `¥ ${parsePriceNumber(price).toLocaleString("ru-RU")}`;
}

function calculateRussiaPrice(priceCny) {
  return parsePriceNumber(priceCny) * CNY_TO_RUB + RUSSIA_DELIVERY_COST_RUB;
}

function getPostLimit() {
  const parsed = Number(process.env.POST_LIMIT || 1);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function getLocalImagePath(car) {
  const images = Array.isArray(car.images) ? car.images : [];
  const image = [...images, car.image].find(
    (item) => typeof item === "string" && item.startsWith("/uploads/cars/")
  );

  if (!image) {
    return "";
  }

  const localPath = path.join(ROOT_DIR, "public", image.replace(/^\//, ""));

  return fs.existsSync(localPath) ? localPath : "";
}

function buildMessage(car) {
  const carUrl = `${SITE_URL}/car/${car.id}`;
  const priceRub = formatRubPrice(calculateRussiaPrice(car.price));

  return [
    `🚘 ${car.title}`,
    "",
    `Год: ${car.year || "уточняется"}`,
    `Пробег: ${car.mileage || "уточняется"}`,
    `Цена: ≈ ${priceRub}`,
    `Цена в Китае: ${formatCnyPrice(car.price)}`,
    "",
    carUrl,
    "",
    "Оставить заявку / забронировать авто",
  ].join("\n");
}

async function sendTextPost({ token, channelId, text }) {
  return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: channelId,
      text,
      disable_web_page_preview: false,
    }),
  });
}

async function sendPhotoPost({ token, channelId, text, imagePath }) {
  const formData = new FormData();
  const imageBuffer = fs.readFileSync(imagePath);
  const imageBlob = new Blob([imageBuffer], { type: "image/webp" });

  formData.append("chat_id", channelId);
  formData.append("caption", text);
  formData.append("photo", imageBlob, path.basename(imagePath));

  return fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: "POST",
    body: formData,
  });
}

async function postCar({ token, channelId, car }) {
  const message = buildMessage(car);
  const imagePath = getLocalImagePath(car);
  const response = imagePath
    ? await sendPhotoPost({ token, channelId, text: message, imagePath })
    : await sendTextPost({ token, channelId, text: message });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.ok) {
    throw new Error(
      `Telegram post failed for car ${car.id}: ${JSON.stringify(data)}`
    );
  }

  console.log(
    `Posted car ID ${car.id} ${imagePath ? "with photo" : "without photo"}`
  );
}

async function main() {
  loadEnvFile(ENV_PATH);

  const isDryRun = process.env.DRY_RUN === "true";
  const shouldResetPostedCars = process.env.RESET_POSTED_CARS === "true";
  const postLimit = getPostLimit();
  const token = process.env.TELEGRAM_TOKEN;
  const channelId = process.env.TELEGRAM_CHANNEL_ID || "@avtoimort";

  if (!token && !isDryRun) {
    throw new Error("Set TELEGRAM_TOKEN before running this script.");
  }

  const cars = JSON.parse(fs.readFileSync(CARS_PATH, "utf8"));
  const postedIds = fs.existsSync(POSTED_PATH)
    ? JSON.parse(fs.readFileSync(POSTED_PATH, "utf8"))
    : [];

  if (shouldResetPostedCars) {
    fs.writeFileSync(POSTED_PATH, JSON.stringify([], null, 2));
    console.log("posted-cars.json was reset because RESET_POSTED_CARS=true.");
    return;
  }

  const carsToPost = cars
    .filter((car) => !postedIds.includes(car.id))
    .slice(0, postLimit);

  console.log("Telegram autopost settings:");
  console.log(`- channel id: ${channelId}`);
  console.log(`- POST_LIMIT: ${postLimit}`);
  console.log(`- cars found: ${cars.length}`);
  console.log(`- already posted: ${postedIds.length}`);
  console.log(`- will send: ${carsToPost.length}`);
  console.log(`- DRY_RUN: ${isDryRun}`);

  if (carsToPost.length === 0) {
    console.log("No cars to post within POST_LIMIT.");
    return;
  }

  if (isDryRun) {
    console.log("DRY_RUN=true: no Telegram requests will be sent.");
    console.log("DRY_RUN=true: posted-cars.json will not be changed.");

    for (const car of carsToPost) {
      const imagePath = getLocalImagePath(car);

      console.log(
        [
          `Would post car ID ${car.id}: ${car.title}`,
          `- url: ${SITE_URL}/car/${car.id}`,
          `- photo: ${imagePath || "text post only"}`,
        ].join("\n")
      );
    }

    return;
  }

  for (const car of carsToPost) {
    await postCar({ token, channelId, car });
    postedIds.push(car.id);
  }

  fs.writeFileSync(POSTED_PATH, JSON.stringify(postedIds, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
