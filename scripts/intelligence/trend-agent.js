const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const SOURCES_PATH = path.join(ROOT_DIR, "AMOS", "intelligence", "sources.json");
const REFERENCE_LIBRARY_PATH = path.join(
  ROOT_DIR,
  "AMOS",
  "intelligence",
  "reference_library.json"
);

const SEED_REFERENCES = [
  {
    id: "ref_001",
    sourceId: "manual_seed",
    platform: "vk",
    url: null,
    project: "AutoVector",
    topic: "Почему клиенты боятся покупать авто из Китая",
    contentType: "expert",
    rawText:
      "Клиенты часто боятся не самой покупки автомобиля из Китая, а неизвестности: как проверить машину, кто отвечает за расчёт, что будет с документами и доставкой.",
    observedHook: "Главный страх клиента - не Китай, а неизвестность.",
    observedCTA: "Разберите покупку с менеджером до первого платежа.",
    engagementSignal: "manual_seed",
    whyItWorks: [
      "цепляет страх клиента",
      "объясняет риск простыми словами",
      "подводит к консультации",
    ],
    inspirationFor: ["vk", "telegram"],
    status: "new",
    collectedBy: "trend_agent_v1",
    mode: "trend_scout",
  },
  {
    id: "ref_002",
    sourceId: "manual_seed",
    platform: "vk",
    url: null,
    project: "AutoVector",
    topic: "Чек-лист перед покупкой автомобиля из Азии",
    contentType: "checklist",
    rawText:
      "Перед покупкой стоит проверить состояние, пробег, комплектацию, итоговую цену под ключ, сроки доставки и кто сопровождает сделку.",
    observedHook: "Перед покупкой авто из Азии проверьте не только цену.",
    observedCTA: "Попросите подбор с прозрачным расчётом.",
    engagementSignal: "manual_seed",
    whyItWorks: [
      "даёт практическую пользу",
      "снижает тревожность",
      "показывает экспертность без давления",
    ],
    inspirationFor: ["vk", "telegram"],
    status: "new",
    collectedBy: "trend_agent_v1",
    mode: "trend_scout",
  },
  {
    id: "ref_003",
    sourceId: "manual_seed",
    platform: "vk",
    url: null,
    project: "AutoVector",
    topic: "Мини-кейс: клиент выбирает семейный автомобиль",
    contentType: "case",
    rawText:
      "Клиенту нужен был понятный семейный автомобиль, но варианты отличались по рынкам, состоянию и итоговой стоимости. Сервис помог сравнить предложения и убрать слабые варианты.",
    observedHook: "Иногда клиенту нужен не список машин, а спокойное сравнение вариантов.",
    observedCTA: "Опишите задачу, и менеджер соберёт понятный shortlist.",
    engagementSignal: "manual_seed",
    whyItWorks: [
      "показывает ситуацию клиента",
      "демонстрирует роль сопровождения",
      "ведёт к заявке через доверие",
    ],
    inspirationFor: ["vk", "telegram"],
    status: "new",
    collectedBy: "trend_agent_v1",
    mode: "trend_scout",
  },
];

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function withCollectedAt(reference) {
  return {
    ...reference,
    collectedAt: new Date().toISOString(),
  };
}

function main() {
  const sources = readJson(SOURCES_PATH, []);
  const referenceLibrary = readJson(REFERENCE_LIBRARY_PATH, []);
  const existingIds = new Set(referenceLibrary.map((reference) => reference.id));

  const newReferences = SEED_REFERENCES.filter(
    (reference) => !existingIds.has(reference.id)
  ).map(withCollectedAt);

  const nextReferenceLibrary = [...referenceLibrary, ...newReferences];
  writeJson(REFERENCE_LIBRARY_PATH, nextReferenceLibrary);

  console.log(`Trend Agent: sources loaded ${sources.length}`);
  console.log(`Trend Agent: references total ${nextReferenceLibrary.length}`);
  console.log(
    `Trend Agent: new refs added ${
      newReferences.length
        ? newReferences.map((reference) => reference.id).join(", ")
        : "none"
    }`
  );
}

main();
