const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const CONTENT_QUEUE_PATH = path.join(ROOT_DIR, "app", "data", "content_queue.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function getNextContentId(queue) {
  const lastNumber = queue.reduce((max, item) => {
    const match = String(item.id || "").match(/^content_(\d+)$/);
    if (!match) return max;

    return Math.max(max, Number(match[1]));
  }, 0);

  return `content_${String(lastNumber + 1).padStart(3, "0")}`;
}

function createAutoVectorVkDraft(id) {
  const createdAt = new Date().toISOString();

  return {
    id,
    type: "social_post",
    platforms: ["vk"],
    status: "draft",
    topic: "Спокойный подбор автомобиля из Азии под ключ",
    text: [
      "Покупка автомобиля из Китая, Кореи или Японии не должна превращаться в стресс.",
      "AutoVector помогает пройти этот путь спокойно: от подбора вариантов до проверки, расчёта и сопровождения сделки.",
      "Мы заранее показываем реальные фото, объясняем стоимость и держим связь на каждом этапе.",
    ].join("\n\n"),
    cta: "Оставьте заявку — подскажем, какие автомобили подходят под ваш бюджет и задачи.",
    hashtags: [
      "AutoVector",
      "автоизкитая",
      "автоизкореи",
      "автоизяпонии",
      "автоподбор",
    ],
    imagePrompt: "Premium lifestyle photo: calm client and consultant discussing a car purchase near a modern BMW or Lexus, dark elegant AutoVector style, trustworthy concierge service mood.",
    image: null,
    createdBy: "content_creator_agent",
    createdAt,
  };
}

function main() {
  const queue = readJson(CONTENT_QUEUE_PATH);
  const nextId = getNextContentId(queue);
  const draft = createAutoVectorVkDraft(nextId);

  queue.push(draft);
  writeJson(CONTENT_QUEUE_PATH, queue);

  console.log(`Content Creator Agent: created ${nextId}`);
  console.log("Content Creator Agent: status draft");
  console.log("Content Creator Agent: Publisher Agent will not publish this until status is approved.");
}

main();
