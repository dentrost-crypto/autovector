const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const ENV_PATH = path.join(ROOT_DIR, ".env.local");
const CARS_PATH = path.join(ROOT_DIR, "app", "data", "cars.json");
const POSTED_PATH = path.join(ROOT_DIR, "app", "data", "posted-cars.json");
const SITE_URL = "https://www.autovector.pro";
const CNY_TO_RUB = 10.5;
const RUSSIA_DELIVERY_COST_RUB = 900000;
const TELEGRAM_CAPTION_SAFE_LIMIT = 900;

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

function hasUsefulValue(value) {
  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 && !/^\([^)]*\)$/.test(trimmed);
}

function addLine(lines, text) {
  if (text) {
    lines.push(text);
  }
}

function getUsefulValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();

  if (!trimmed || /^\([^)]*\)$/.test(trimmed) || /уточняется/i.test(trimmed)) {
    return "";
  }

  return trimmed;
}

function formatEngineVolume(value) {
  const text = getUsefulValue(value);
  const match = text.match(/(\d{4})\s*см/i);

  if (!match) {
    return text;
  }

  const liters = Number(match[1]) / 1000;

  return `${liters.toLocaleString("ru-RU", { maximumFractionDigits: 1 })} л`;
}

function formatDimensions(value) {
  return getUsefulValue(value).replace(/[xх*]/gi, "×");
}

function parseMileageKm(value) {
  const match = String(value || "").match(/([\d\s]+)\s*км/i);

  if (!match) {
    return 0;
  }

  return Number(match[1].replace(/\D/g, ""));
}

function getBrand(car) {
  const text = `${car.modelName || ""} ${car.title || ""}`.toLowerCase();

  if (text.includes("bmw")) {
    return "bmw";
  }

  if (text.includes("toyota")) {
    return "toyota";
  }

  return "default";
}

function getModelFamily(car) {
  const text = `${car.modelName || ""} ${car.title || ""}`;

  if (/x1/i.test(text)) {
    return "кроссовер";
  }

  if (/corolla/i.test(text)) {
    return "седан";
  }

  if (/1\s*(series|серии)/i.test(text)) {
    return "городской хэтчбек";
  }

  return "автомобиль";
}

function formatShortPrice(price) {
  const value = Math.round(price);

  if (value >= 1000000) {
    return `${(value / 1000000).toLocaleString("ru-RU", {
      maximumFractionDigits: 1,
    })} млн ₽`;
  }

  return formatRubPrice(value);
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

function getLocalImagePaths(car) {
  const images = Array.isArray(car.images) ? car.images : [];
  const seen = new Set();

  return [...images, car.image]
    .filter((item) => typeof item === "string" && item.startsWith("/uploads/cars/"))
    .filter((item) => {
      if (seen.has(item)) {
        return false;
      }

      seen.add(item);
      return true;
    })
    .map((image) => path.join(ROOT_DIR, "public", image.replace(/^\//, "")))
    .filter((localPath) => fs.existsSync(localPath));
}

function buildTemplateCarPost(car) {
  const carUrl = `${SITE_URL}/car/${car.id}`;
  const imagePaths = getLocalImagePaths(car);
  const imagePath = imagePaths[0] || getLocalImagePath(car);
  const priceRubNumber = calculateRussiaPrice(car.price);
  const priceRub = formatRubPrice(priceRubNumber);
  const title = car.modelName || car.title;
  const brand = getBrand(car);
  const modelFamily = getModelFamily(car);
  const mileageKm = parseMileageKm(car.mileage);
  const lowMileage = mileageKm > 0 && mileageKm <= 50000;
  const lowFuelConsumption =
    parsePriceNumber(car.fuelConsumption || car.wltcFuelConsumption) > 0 &&
    parsePriceNumber(car.fuelConsumption || car.wltcFuelConsumption) <= 6.5;
  const strongPrice = priceRubNumber > 0 && priceRubNumber < 2000000;
  const highlights = [];
  const suitableFor = [];
  const reasons = [];
  const engineParts = [
    formatEngineVolume(car.engineVolume || car.volume),
    getUsefulValue(car.maxPowerKw) ? `${getUsefulValue(car.maxPowerKw)} кВт` : "",
    getUsefulValue(car.torqueNm || car.maxTorqueNm)
      ? `${getUsefulValue(car.torqueNm || car.maxTorqueNm)} Н·м`
      : "",
  ].filter(Boolean);
  const fuelConsumption = getUsefulValue(car.fuelConsumption || car.wltcFuelConsumption);
  const acceleration0100 = getUsefulValue(car.acceleration0100);
  const maxSpeed = getUsefulValue(car.maxSpeed);
  const dimensions = formatDimensions(car.dimensions);

  if (brand === "bmw") {
    highlights.push(
      "BMW выбирают за ощущение статуса, уверенную управляемость и более собранный характер в ежедневных поездках."
    );
    reasons.push("• статусный внешний вид — машина выглядит дороже и увереннее в потоке");
    suitableFor.push("современный статусный автомобиль без лишней показности");
  } else if (brand === "toyota") {
    highlights.push(
      "Toyota — спокойный выбор для тех, кто ценит надёжность, ликвидность и понятные расходы на владение."
    );
    reasons.push("• спокойный выбор на каждый день: надёжность, ликвидность и понятные расходы");
    suitableFor.push("надёжный автомобиль для себя или семьи");
  } else {
    highlights.push(
      "Это вариант под заказ из Азии для тех, кому важны понятные исходные данные, свежий год и проверка перед покупкой."
    );
    reasons.push("• понятные исходные данные — легче принять решение без лишней суеты");
    suitableFor.push("автомобиль с прозрачными исходными данными");
  }

  if (/m\s*sport/i.test(`${title} ${car.title}`)) {
    reasons.push("• M Sport добавляет выразительный вид и ощущение автомобиля выше классом");
    suitableFor.push("красивый автомобиль, который приятно видеть каждый день");
  }

  if (fuelConsumption) {
    reasons.push(`• расход WLTC ${fuelConsumption} л/100 км — меньше регулярных затрат на поездки`);
  }

  if (lowFuelConsumption) {
    highlights.push(
      "Заявленный расход выглядит спокойным для повседневной эксплуатации: меньше лишних трат на регулярных поездках."
    );
    suitableFor.push("экономичные поездки по городу и делам");
  }

  if (getUsefulValue(car.torqueNm || car.maxTorqueNm)) {
    reasons.push(`• ${getUsefulValue(car.torqueNm || car.maxTorqueNm)} Н·м — уверенная тяга для города и трассы`);
  }

  if (lowMileage) {
    reasons.push(`• пробег ${car.mileage} — приятный плюс для дальнейшей эксплуатации`);
    suitableFor.push("вариант с умеренным пробегом");
  } else if (car.mileage) {
    reasons.push(`• пробег указан сразу: ${car.mileage}, без лишних уточнений на старте`);
  }

  if (strongPrice) {
    reasons.push(`• цена под ключ около ${formatShortPrice(priceRubNumber)} — сильный аргумент для премиального бренда`);
    suitableFor.push("сильное предложение по цене под ключ");
  }

  if (hasUsefulValue(car.gearbox)) {
    reasons.push(`• автоматическая коробка — комфортнее в ежедневном городском ритме`);
  }

  if (hasUsefulValue(car.driveType)) {
    reasons.push(`• ${car.driveType} — понятное поведение в обычных поездках`);
  }

  if (engineParts.length > 0) {
    reasons.push(`• двигатель ${engineParts.join(" / ")} — баланс динамики и повседневности`);
  }

  if (acceleration0100 || maxSpeed) {
    reasons.push(
      [
        acceleration0100 ? `разгон 0–100: ${acceleration0100} с` : "",
        maxSpeed ? `макс. скорость: ${maxSpeed} км/ч` : "",
      ]
        .filter(Boolean)
        .join("; ")
    );
  }

  if (dimensions) {
    reasons.push(`• габариты: ${dimensions} мм`);
  }

  if (hasUsefulValue(car.seats)) {
    suitableFor.push(`${car.seats}-местный салон для семьи и повседневных задач`);
  }

  suitableFor.push("комфортные поездки по городу и за город");
  suitableFor.push(`ликвидный ${modelFamily} с понятной историей предложения`);

  const text = [
    `🚘 ${title}`,
    "━━━━━━━━━━━━",
    "",
    highlights.slice(0, 2).join(" "),
    `Год: ${car.year || "уточняется"}, пробег: ${car.mileage || "уточняется"}. Вариант для тех, кто хочет красивый, понятный и комфортный автомобиль под ключ.`,
    "",
    "✨ Подойдёт если вы ищете:",
    ...Array.from(new Set(suitableFor)).slice(0, 3).map((item) => `• ${item}`),
    "",
    "🔥 Почему этот вариант интересен:",
    ...Array.from(new Set(reasons))
      .slice(0, 5)
      .map((item) => item.replace("хороший ориентир", "сильный плюс")),
    "",
    "━━━━━━━━━━━━",
    "💰 Цена",
    `Под ключ в РФ: ≈ ${priceRub}`,
    "━━━━━━━━━━━━",
    "",
    "📲 Смотреть авто:",
    carUrl,
    "",
    "Напишите менеджеру — подскажем по наличию, расчёту и следующему шагу.",
    "",
    "Актуальность предложения и состояние автомобиля дополнительно проверяем перед покупкой.",
  ].join("\n");

  return {
    title,
    text,
    imagePath,
    imagePaths,
    images: imagePaths,
    carUrl,
    source: "template",
  };
}

function buildAiCarData(car, carUrl) {
  return {
    title: car.title,
    modelName: car.modelName,
    year: car.year,
    mileage: car.mileage,
    priceCny: formatCnyPrice(car.price),
    calculatedRubPrice: `≈ ${formatRubPrice(calculateRussiaPrice(car.price))}`,
    gearbox: getUsefulValue(car.gearbox),
    driveType: getUsefulValue(car.driveType),
    engineVolume: getUsefulValue(car.engineVolume || car.volume),
    power: getUsefulValue(car.power),
    torqueNm: getUsefulValue(car.torqueNm || car.maxTorqueNm),
    fuelConsumption: getUsefulValue(car.fuelConsumption || car.wltcFuelConsumption),
    acceleration0100: getUsefulValue(car.acceleration0100),
    maxSpeed: getUsefulValue(car.maxSpeed),
    dimensions: getUsefulValue(car.dimensions),
    seats: getUsefulValue(car.seats),
    carUrl,
  };
}

function removeEmptyFields(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => {
      if (fieldValue === undefined || fieldValue === null) {
        return false;
      }

      if (typeof fieldValue === "string") {
        return fieldValue.trim().length > 0;
      }

      return true;
    })
  );
}

async function generateAiPostText(carData) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.75,
      max_tokens: 700,
      messages: [
        {
          role: "system",
          content:
            "Ты маркетолог AutoVector. Пиши живые продающие Telegram-посты на русском языке. Не выдумывай факты, не обещай гарантию, используй только переданные данные.",
        },
        {
          role: "user",
          content: [
            "Создай продающий Telegram-пост на русском языке для автомобиля.",
            "Пиши для аудитории женщин и мужчин 35–55 лет, которые хотят свежий, понятный и надёжный автомобиль из Азии под ключ.",
            "Не пиши как автоэксперт для автоэкспертов.",
            "Сделай текст живым, понятным и доверительным.",
            "",
            "Структура поста:",
            "- цепляющий заголовок;",
            "- 2–3 предложения эмоционального описания;",
            "- 5–7 преимуществ автомобиля;",
            "- цена в Китае;",
            "- ориентир под ключ в РФ;",
            "- ссылка на карточку;",
            "- призыв написать менеджеру / оставить заявку;",
            "- дисклеймер: актуальность предложения и состояние автомобиля дополнительно проверяем перед покупкой.",
            "",
            "Важно:",
            "- не обещать гарантию;",
            "- не выдумывать факты;",
            "- если какого-то параметра нет, не упоминать его;",
            "- не писать слишком длинно;",
            "- стиль Telegram: живой, продающий, но без дешёвого крика.",
            "",
            `Данные автомобиля:\n${JSON.stringify(removeEmptyFields(carData), null, 2)}`,
          ].join("\n"),
        },
      ],
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${JSON.stringify(data)}`);
  }

  const text = data.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new Error("OpenAI API returned an empty post text.");
  }

  return text;
}

async function buildCarPost(car) {
  return buildTemplateCarPost(car);
}

// Publishing adapters. Later this can grow into:
// async function publishToVk(post) { ... }
// function prepareMaxPost(post) { ... }
// future: buildCarVideo(post.images)
// future: publishVideoToTelegram(videoPath, post.text)
async function publishToTelegram(post) {
  const token = process.env.TELEGRAM_TOKEN;
  const channelId = process.env.TELEGRAM_CHANNEL_ID || "@avtoimort";
  const captionLength = post.text.length;
  const mode = getTelegramPostMode(post);

  console.log(`Caption length: ${captionLength}`);
  console.log(`Telegram post mode: ${mode}`);

  if (!post.imagePath) {
    return sendTextPost({ token, channelId, text: post.text });
  }

  if (mode === "photo_then_message") {
    const photoResponse = await sendPhotoOnlyPost({
      token,
      channelId,
      imagePath: post.imagePath,
    });
    const photoData = await photoResponse.json().catch(() => ({}));

    if (!photoResponse.ok || !photoData.ok) {
      return photoResponse;
    }

    return sendTextPost({ token, channelId, text: post.text });
  }

  return sendPhotoPost({
    token,
    channelId,
    text: post.text,
    imagePath: post.imagePath,
  });
}

function getTelegramPostMode(post) {
  if (!post.imagePath) {
    return "text";
  }

  return post.text.length > TELEGRAM_CAPTION_SAFE_LIMIT
    ? "photo_then_message"
    : "photo+caption";
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

async function sendPhotoOnlyPost({ token, channelId, imagePath }) {
  const formData = new FormData();
  const imageBuffer = fs.readFileSync(imagePath);
  const imageBlob = new Blob([imageBuffer], { type: "image/webp" });

  formData.append("chat_id", channelId);
  formData.append("photo", imageBlob, path.basename(imagePath));

  return fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: "POST",
    body: formData,
  });
}

async function postCar({ car }) {
  const post = await buildCarPost(car);
  const response = await publishToTelegram(post);
  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.ok) {
    throw new Error(
      `Telegram post failed for car ${car.id}: ${JSON.stringify(data)}`
    );
  }

  console.log(
    `Posted car ID ${car.id} ${post.imagePath ? "with photo" : "without photo"}`
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
      const post = await buildCarPost(car);
      const captionLength = post.text.length;
      const telegramMode = getTelegramPostMode(post);

      console.log(
        [
          `Would post car ID ${car.id}: ${car.title}`,
          `Source: ${post.source}`,
          `Caption length: ${captionLength}`,
          `Telegram post mode: ${telegramMode}`,
          JSON.stringify(post, null, 2),
          "",
          post.text,
        ].join("\n")
      );
    }

    return;
  }

  for (const car of carsToPost) {
    await postCar({ car });
    postedIds.push(car.id);
  }

  fs.writeFileSync(POSTED_PATH, JSON.stringify(postedIds, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
