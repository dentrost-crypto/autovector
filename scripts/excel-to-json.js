const XLSX = require("xlsx");
const fs = require("fs");

function cleanNumber(value) {
  if (!value) return 0;

  return Number(String(value).replace(/[^\d]/g, ""));
}

function getCell(row, ...keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) {
      return row[key];
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

const workbook = XLSX.readFile("C:/Users/Den/Desktop/car_site/app/data/korex_latest.xlsx");
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

const DEBUG_LIMIT = 5;
const rows = XLSX.utils.sheet_to_json(worksheet).slice(0, DEBUG_LIMIT);

const cars = rows.map((car, index) => {
  const fallbackImage = getCell(car, "Фото", "Р¤РѕС‚Рѕ");
  const images = parseImages(getCell(car, "images"), fallbackImage);

  return {
    id: index + 1,
    title: getCell(car, "Название", "РќР°Р·РІР°РЅРёРµ"),
    link: getCell(car, "Ссылка", "РЎСЃС‹Р»РєР°"),
    price: cleanNumber(getCell(car, "Цена в Китае", "Р¦РµРЅР° РІ РљРёС‚Р°Рµ")),
    delivery: 0,
    fee: 0,
    year: getCell(car, "Год", "Р“РѕРґ"),
    mileage: getCell(car, "Пробег", "РџСЂРѕР±РµРі"),
    engine: getCell(car, "Двигатель", "Р”РІРёРіР°С‚РµР»СЊ"),
    volume: getCell(car, "Объём", "РћР±СЉС‘Рј"),
    power: getCell(car, "Мощность", "РњРѕС‰РЅРѕСЃС‚СЊ"),
    country: "Китай",
    image: images[0] || "",
    images,
  };
});

fs.writeFileSync("./app/data/cars.json", JSON.stringify(cars, null, 2));

console.log(`Готово. Загружено авто: ${cars.length}`);
