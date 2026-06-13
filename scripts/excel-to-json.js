const XLSX = require("xlsx");
const fs = require("fs");

const EXCEL_PATH = "./app/data/korex_latest.xlsx";
const DEBUG_LIMIT = null;
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

function detectBrand(...values) {
  const text = normalizeSpaces(values.filter(Boolean).join(" ")).toLowerCase();

  if (text.includes("toyota")) return "Toyota";
  if (text.includes("volkswagen")) return "Volkswagen";
  if (text.includes("bmw")) return "BMW";

  return "";
}

function detectModel(brand, ...values) {
  const text = normalizeSpaces(values.filter(Boolean).join(" ")).toLowerCase();

  if (brand === "Toyota") {
    if (text.includes("corolla")) return "Corolla";
    if (text.includes("rav4") || text.includes("rav 4")) return "RAV4";
    if (text.includes("camry")) return "Camry";
    if (text.includes("wildlander")) return "Wildlander";
    if (text.includes("avalon")) return "Avalon";
  }

  if (brand === "Volkswagen") {
    if (text.includes("tiguan-l") || text.includes("tiguan l")) return "Tiguan L";
    if (text.includes("tayron")) return "Tayron";
    if (text.includes("bora")) return "Bora";
    if (text.includes("lavida")) return "Lavida";
    if (text.includes("passat")) return "Passat";
  }

  if (brand === "BMW") {
    if (/\bx2\b/.test(text)) return "X2";
    if (/\bx1\b/.test(text)) return "X1";
    if (/\b2\s*(series|серии|er)\b/.test(text) || /\b22[0-9]i\b/.test(text) || /\b218i\b/.test(text)) return "Series 2";
    if (/\b1\s*(series|серии|er)\b/.test(text) || /\b12[0-9]i\b/.test(text) || /\b118i\b/.test(text)) return "Series 1";
  }

  return "";
}

function cleanTitle(value, fallbackYear) {
  const text = normalizeSpaces(value);
  const year = getYear(text) || getYear(fallbackYear);
  const beforeMileage = text.split(/,\s*\u043f\u0440\u043e\u0431\u0435\u0433/i)[0].trim();
  const brand = detectBrand(beforeMileage) || "BMW";
  const model = detectModel(brand, beforeMileage) || beforeMileage.replace(new RegExp(`^${brand}\\s+`, "i"), "");

  return normalizeSpaces([brand, model, year ? `${year} \u0433.` : ""].join(" "));
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

function cleanSpecValue(value) {
  const text = normalizeSpaces(value);

  if (!text || /^\([^)]*\)$/.test(text)) {
    return "";
  }

  return text;
}

function getSpecCell(row, ...keys) {
  return cleanSpecValue(getCell(row, ...keys));
}

function parseDimensions(dimensions) {
  const text = normalizeSpaces(dimensions);
  const match = text.match(/(\d{3,5})\D+(\d{3,5})\D+(\d{3,5})/);

  if (!match) {
    return {
      bodyLength: "",
      bodyWidth: "",
      bodyHeight: "",
    };
  }

  return {
    bodyLength: `${match[1]} \u043c\u043c`,
    bodyWidth: `${match[2]} \u043c\u043c`,
    bodyHeight: `${match[3]} \u043c\u043c`,
  };
}

const workbook = XLSX.readFile(EXCEL_PATH);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const allRows = XLSX.utils.sheet_to_json(worksheet);
const rows = DEBUG_LIMIT ? allRows.slice(0, DEBUG_LIMIT) : allRows;

const cars = rows.map((car, index) => {
  const rawTitle = getCell(car, COLUMNS.title);
  const rawYear = getCell(car, COLUMNS.year);
  const rawMileage = getCell(car, COLUMNS.mileage);
  const rawModelName = getCell(car, "modelName");
  const rawManufacturer = getCell(car, "manufacturer");
  const rawLink = getCell(car, COLUMNS.link);
  const brand = getCell(car, "brand") || detectBrand(rawManufacturer, rawModelName, rawTitle, rawLink);
  const model = getCell(car, "model") || detectModel(brand, rawModelName, rawTitle, rawLink);
  const fallbackImage = getCell(car, COLUMNS.photo);
  const localImages = getExistingLocalImages(index + 1);
  const parsedImages = parseImages(getCell(car, "images"), "");
  const images = localImages.length > 0 ? localImages : parsedImages;
  const remoteImages = uniqueStrings([
    ...parseImages(getCell(car, "remoteImages"), ""),
    fallbackImage,
  ]);
  const dimensions = getSpecCell(
    car,
    "dimensions",
    "\u0414\u043b\u0438\u043d\u0430*\u0448\u0438\u0440\u0438\u043d\u0430*\u0432\u044b\u0441\u043e\u0442\u0430",
    "\u0414\u043b\u0438\u043d\u0430\u00d7\u0448\u0438\u0440\u0438\u043d\u0430\u00d7\u0432\u044b\u0441\u043e\u0442\u0430",
    "\u0414\u043b\u0438\u043d\u0430 \u0445 \u0448\u0438\u0440\u0438\u043d\u0430 \u0445 \u0432\u044b\u0441\u043e\u0442\u0430"
  );
  const parsedDimensions = parseDimensions(dimensions);

  return {
    id: index + 1,
    title: cleanTitle(rawTitle, rawYear),
    link: rawLink,
    brand,
    model,
    price: cleanNumber(getCell(car, COLUMNS.price)),
    delivery: 0,
    fee: 0,
    year: getYear(rawYear) || getYear(rawTitle),
    mileage: cleanMileage(rawMileage, rawTitle),
    engine: getCell(car, COLUMNS.engine),
    volume: getCell(car, COLUMNS.volume),
    power: getCell(car, COLUMNS.power),
    modelName: rawModelName,
    manufacturer: rawManufacturer,
    energyType: getCell(car, "energyType"),
    engineFull: getCell(car, "engineFull"),
    gearbox: getCell(car, "gearbox"),
    driveType: getCell(car, "driveType"),
    wltcFuelConsumption: getSpecCell(car, "wltcFuelConsumption"),
    maxPowerKw: getSpecCell(car, "maxPowerKw"),
    maxTorqueNm: getSpecCell(car, "maxTorqueNm"),
    dimensions,
    wheelbase: getSpecCell(car, "wheelbase"),
    seats: getSpecCell(car, "seats"),
    fuelTankVolume: getSpecCell(car, "fuelTankVolume"),
    tireSize: getSpecCell(car, "tireSize"),
    torqueNm: getSpecCell(
      car,
      "torqueNm",
      "maxTorqueNm",
      "\u041c\u0430\u043a\u0441\u0438\u043c\u0430\u043b\u044c\u043d\u044b\u0439 \u043a\u0440\u0443\u0442\u044f\u0449\u0438\u0439 \u043c\u043e\u043c\u0435\u043d\u0442",
      "\u041a\u0440\u0443\u0442\u044f\u0449\u0438\u0439 \u043c\u043e\u043c\u0435\u043d\u0442"
    ),
    fuelConsumption: getSpecCell(
      car,
      "fuelConsumption",
      "wltcFuelConsumption",
      "\u0420\u0430\u0441\u0445\u043e\u0434 WLTC",
      "\u0420\u0430\u0441\u0445\u043e\u0434 \u0442\u043e\u043f\u043b\u0438\u0432\u0430 WLTC",
      "\u0420\u0430\u0441\u0445\u043e\u0434 \u0442\u043e\u043f\u043b\u0438\u0432\u0430"
    ),
    acceleration0100: getSpecCell(
      car,
      "acceleration0100",
      "\u0420\u0430\u0437\u0433\u043e\u043d 0-100",
      "\u0420\u0430\u0437\u0433\u043e\u043d 0-100 \u043a\u043c/\u0447",
      "0-100"
    ),
    maxSpeed: getSpecCell(
      car,
      "maxSpeed",
      "\u041c\u0430\u043a\u0441\u0438\u043c\u0430\u043b\u044c\u043d\u0430\u044f \u0441\u043a\u043e\u0440\u043e\u0441\u0442\u044c",
      "\u041c\u0430\u043a\u0441. \u0441\u043a\u043e\u0440\u043e\u0441\u0442\u044c"
    ),
    engineVolume: getSpecCell(
      car,
      "engineVolume",
      "engineVolumeMl",
      "displacement",
      COLUMNS.volume,
      "\u041e\u0431\u044a\u0451\u043c \u0434\u0432\u0438\u0433\u0430\u0442\u0435\u043b\u044f"
    ),
    cylinders: getSpecCell(
      car,
      "cylinders",
      "\u0426\u0438\u043b\u0438\u043d\u0434\u0440\u044b",
      "\u041a\u043e\u043b-\u0432\u043e \u0446\u0438\u043b\u0438\u043d\u0434\u0440\u043e\u0432",
      "\u0427\u0438\u0441\u043b\u043e \u0446\u0438\u043b\u0438\u043d\u0434\u0440\u043e\u0432"
    ),
    turboType: getSpecCell(
      car,
      "turboType",
      "\u0422\u0438\u043f \u043d\u0430\u0434\u0434\u0443\u0432\u0430",
      "\u0422\u0443\u0440\u0431\u0438\u043d\u0430",
      "\u041d\u0430\u0434\u0434\u0443\u0432"
    ),
    bodyLength: getSpecCell(car, "bodyLength", "\u0414\u043b\u0438\u043d\u0430") || parsedDimensions.bodyLength,
    bodyWidth: getSpecCell(car, "bodyWidth", "\u0428\u0438\u0440\u0438\u043d\u0430") || parsedDimensions.bodyWidth,
    bodyHeight: getSpecCell(car, "bodyHeight", "\u0412\u044b\u0441\u043e\u0442\u0430") || parsedDimensions.bodyHeight,
    country: "\u041a\u0438\u0442\u0430\u0439",
    image: images[0] || FALLBACK_IMAGE,
    images,
    remoteImages,
  };
});

fs.writeFileSync("./app/data/cars.json", JSON.stringify(cars, null, 2));

console.log(`Done. Loaded cars: ${cars.length}`);
