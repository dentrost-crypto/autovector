const XLSX = require("xlsx");
const fs = require("fs");

const EXCEL_PATH = "./app/data/korex_latest.xlsx";
const DEBUG_LIMIT = 21;
const FALLBACK_IMAGE = "/uploads/fallback.svg";

const COLUMNS = {
  title: "\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435",
  link: "\u0421\u0441\u044b\u043b\u043a\u0430",
  price: "\u0426\u0435\u043d\u0430 \u0432 \u041a\u0438\u0442\u0430\u0435",
  year: "\u0413\u043e\u0434",
  mileage: "\u041f\u0440\u043e\u0431\u0435\u0433",
  engine: "\u0414\u0432\u0438\u0433\u0430\u0442\u0435\u043b\u044c",
  volume: "\u041e\u0431\u044a\u0451\u043c",
  power: "\u041c\u043e\u0449\u043d\u043e\u0441\u0442\u044c",
  photo: "\u0424\u043e\u0442\u043e",
};

function cleanNumber(value) {
  if (!value) return 0;

  return Number(String(value).replace(/[^\d]/g, ""));
}

function normalizeSpaces(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function getCell(row, ...keys) {
  const normalizedKeys = Object.keys(row).reduce((acc, key) => {
    acc[normalizeSpaces(key).toLowerCase()] = key;
    return acc;
  }, {});

  for (const key of keys) {
    const normalizedKey = normalizeSpaces(key).toLowerCase();
    const actualKey = normalizedKeys[normalizedKey];

    if (actualKey && row[actualKey] !== undefined && row[actualKey] !== null) {
      return row[actualKey];
    }
  }

  return "";
}

function uniqueStrings(values) {
  const seen = new Set();
  const result = [];

  for (const value of values) {
    if (typeof value !== "string") continue;

    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) continue;

    seen.add(trimmed);
    result.push(trimmed);
  }

  return result;
}

function parseImages(value, fallbackImage) {
  if (value) {
    try {
      const parsed = JSON.parse(String(value));

      if (Array.isArray(parsed)) {
        const images = uniqueStrings(parsed);

        if (images.length > 0) {
          return images;
        }
      }
    } catch (error) {
      // Older exports may not have valid JSON in the images column.
    }
  }

  return fallbackImage ? [fallbackImage] : [];
}

function getExistingLocalImages(carId) {
  const localImages = [];

  for (let index = 1; index <= 4; index += 1) {
    const publicPath = `/uploads/cars/${carId}/${index}.webp`;

    if (fs.existsSync(`./public${publicPath}`)) {
      localImages.push(publicPath);
    }
  }

  return localImages;
}

function getYear(value) {
  return String(value || "").match(/\b(20\d{2})\b/)?.[1] || "";
}

function cleanTitle(value, fallbackYear) {
  const text = normalizeSpaces(value);
  const year = getYear(text) || getYear(fallbackYear);
  const beforeMileage = text.split(/,\s*\u043f\u0440\u043e\u0431\u0435\u0433/i)[0].trim();
  const modelMatch = beforeMileage.match(/\bBMW\s+(.+?)(?:\s+20\d{2}|$)/i);
  const model = modelMatch ? modelMatch[1].trim() : beforeMileage;

  return normalizeSpaces(["BMW", model, year ? `${year} \u0433.` : ""].join(" "));
}

function cleanMileage(...values) {
  const text = normalizeSpaces(values.filter(Boolean).join(" "));
  const match =
    text.match(/\u043f\u0440\u043e\u0431\u0435\u0433\s*([\d\s]+)\s*\u043a\u043c/i) ||
    text.match(/([\d\s]{2,})\s*\u043a\u043c/i);

  if (!match) {
    return "";
  }

  const digits = match[1].replace(/\D/g, "");

  return digits ? `${Number(digits).toLocaleString("ru-RU")} \u043a\u043c` : "";
}

const workbook = XLSX.readFile(EXCEL_PATH);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(worksheet).slice(0, DEBUG_LIMIT);

const cars = rows.map((car, index) => {
  const rawTitle = getCell(car, COLUMNS.title);
  const rawYear = getCell(car, COLUMNS.year);
  const rawMileage = getCell(car, COLUMNS.mileage);
  const fallbackImage = getCell(car, COLUMNS.photo);
  const localImages = getExistingLocalImages(index + 1);
  const parsedImages = parseImages(getCell(car, "images"), "");
  const images = localImages.length > 0 ? localImages : parsedImages;
  const remoteImages = uniqueStrings([
    ...parseImages(getCell(car, "remoteImages"), ""),
    fallbackImage,
  ]);

  return {
    id: index + 1,
    title: cleanTitle(rawTitle, rawYear),
    link: getCell(car, COLUMNS.link),
    price: cleanNumber(getCell(car, COLUMNS.price)),
    delivery: 0,
    fee: 0,
    year: getYear(rawYear) || getYear(rawTitle),
    mileage: cleanMileage(rawMileage, rawTitle),
    engine: getCell(car, COLUMNS.engine),
    volume: getCell(car, COLUMNS.volume),
    power: getCell(car, COLUMNS.power),
    modelName: getCell(car, "modelName"),
    manufacturer: getCell(car, "manufacturer"),
    energyType: getCell(car, "energyType"),
    engineFull: getCell(car, "engineFull"),
    gearbox: getCell(car, "gearbox"),
    driveType: getCell(car, "driveType"),
    wltcFuelConsumption: getCell(car, "wltcFuelConsumption"),
    maxPowerKw: getCell(car, "maxPowerKw"),
    maxTorqueNm: getCell(car, "maxTorqueNm"),
    dimensions: getCell(car, "dimensions"),
    wheelbase: getCell(car, "wheelbase"),
    seats: getCell(car, "seats"),
    fuelTankVolume: getCell(car, "fuelTankVolume"),
    tireSize: getCell(car, "tireSize"),
    country: "\u041a\u0438\u0442\u0430\u0439",
    image: images[0] || FALLBACK_IMAGE,
    images,
    remoteImages,
  };
});

fs.writeFileSync("./app/data/cars.json", JSON.stringify(cars, null, 2));

console.log(`Done. Loaded cars: ${cars.length}`);
