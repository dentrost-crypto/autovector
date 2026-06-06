const XLSX = require('xlsx');
const fs = require('fs');

function cleanNumber(value) {
  if (!value) return 0;

  return Number(
    String(value).replace(/[^\d]/g, '')
  );
}

const workbook = XLSX.readFile('./app/data/korex_latest.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

const rows = XLSX.utils.sheet_to_json(worksheet);

const cars = rows.map((car, index) => ({
  id: index + 1,
  title: car["Название"] || "",
  link: car["Ссылка"] || "",
  price: cleanNumber(car["Цена в Китае"]),
  delivery: 0,
  fee: 0,
  year: car["Год"] || "",
  mileage: car["Пробег"] || "",
  engine: car["Двигатель"] || "",
  volume: car["Объём"] || "",
  power: car["Мощность"] || "",
  country: "Китай",
  image: car["Фото"] || ""
}));

fs.writeFileSync(
  './app/data/cars.json',
  JSON.stringify(cars, null, 2)
);

console.log(`Готово ✅ Загружено авто: ${cars.length}`);