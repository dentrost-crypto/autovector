const fs = require("fs");

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || "@avtoimort";
const MANAGER_URL = process.env.MANAGER_URL || "https://t.me/DenTrosPro";

if (!TELEGRAM_TOKEN) {
  throw new Error("Set TELEGRAM_TOKEN before running this script.");
}

const cars = JSON.parse(fs.readFileSync("./app/data/cars.json", "utf8"));

const postedPath = "./app/data/posted-cars.json";

let postedIds = [];

if (fs.existsSync(postedPath)) {
  postedIds = JSON.parse(fs.readFileSync(postedPath, "utf8"));
}

const car = cars.find((item) => !postedIds.includes(item.id));

if (!car) {
  console.log("Все авто уже опубликованы ✅");
  process.exit();
}

const message = `
🚘 ${car.title}

💰 Цена в Китае: ≈ ${car.price.toLocaleString()} ₽
📏 Пробег: ${car.mileage}
⛽ Двигатель: ${car.engine}
⚡ Мощность: ${car.power || "уточняется"}
🇨🇳 Локация: ${car.country}

🔥 Интересный вариант для тех, кто ищет авто из Азии под заказ.
Можем подобрать похожую машину, проверить состояние и посчитать доставку под ваш бюджет.

📩 Для подбора напишите менеджеру:
— модель
— бюджет
— год
— пожелания по комплектации
`;

async function postCar() {
  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: CHANNEL_ID,
        photo:
          "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1200",
        caption: message,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "💬 Написать менеджеру",
                url: MANAGER_URL,
              },
            ],
          ],
        },
      }),
    }
  );

  const data = await response.json();

  console.log(data);

  if (data.ok) {
    postedIds.push(car.id);

    fs.writeFileSync(
      postedPath,
      JSON.stringify(postedIds, null, 2)
    );

    console.log(`Опубликовано авто ID: ${car.id} ✅`);
  }
}

postCar();
