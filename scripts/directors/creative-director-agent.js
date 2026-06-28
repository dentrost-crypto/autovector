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

function includesAny(text, words) {
  const normalized = String(text || "").toLowerCase();
  return words.some((word) => normalized.includes(word.toLowerCase()));
}

function clampScore(value) {
  return Math.max(1, Math.min(10, value));
}

function scoreHook(content) {
  const text = String(content.text || "");
  const firstLine = text.split(/\n+/).find(Boolean) || "";
  let score = 5;

  if (firstLine.length >= 35 && firstLine.length <= 120) score += 2;
  if (includesAny(firstLine, ["покупка", "автомобиль", "стресс", "спокойно", "выбор"])) score += 1;
  if (firstLine.endsWith("?")) score += 1;
  if (firstLine.length > 160) score -= 2;

  return clampScore(score);
}

function scoreEmotion(content) {
  const text = `${content.topic || ""}\n${content.text || ""}`;
  let score = 5;

  if (includesAny(text, ["спокой", "комфорт", "уверен", "стресс", "стиль", "семь", "довер"])) score += 3;
  if (includesAny(text, ["мечт", "путешеств", "статус"])) score += 1;
  if (includesAny(text, ["срочно", "успей", "только сегодня"])) score -= 2;

  return clampScore(score);
}

function scoreTrust(content) {
  const text = `${content.text || ""}\n${content.cta || ""}`;
  let score = 5;

  if (includesAny(text, ["провер", "прозрач", "реальные фото", "расч", "сопровожд", "связь"])) score += 4;
  if (includesAny(text, ["гарантируем", "100% без риска"])) score -= 2;

  return clampScore(score);
}

function scoreCta(content) {
  const cta = String(content.cta || "");
  let score = 4;

  if (cta.trim()) score += 3;
  if (includesAny(cta, ["оставьте заявку", "подскажем", "напишите", "подбор"])) score += 2;
  if (cta.length > 180) score -= 1;

  return clampScore(score);
}

function scoreBrand(content) {
  const text = `${content.topic || ""}\n${content.text || ""}\n${content.cta || ""}`;
  let score = 5;

  if (includesAny(text, ["autovector"])) score += 2;
  if (includesAny(text, ["китай", "коре", "япон", "азии"])) score += 2;
  if (includesAny(text, ["под ключ", "подбор", "автомобил"])) score += 1;

  return clampScore(score);
}

function scoreReadability(content) {
  const text = String(content.text || "");
  const sentences = text.split(/[.!?]+/).filter((part) => part.trim());
  const paragraphs = text.split(/\n{2,}/).filter((part) => part.trim());
  let score = 5;

  if (text.length >= 180 && text.length <= 700) score += 2;
  if (paragraphs.length >= 2 && paragraphs.length <= 5) score += 2;
  if (sentences.every((sentence) => sentence.trim().length <= 180)) score += 1;
  if (text.length > 900) score -= 2;

  return clampScore(score);
}

function detectGluedWords(content) {
  const text = String(content.text || "");
  const explicitSuspiciousWords = [
    "идержим",
    "ипоказываем",
    "ичестно",
    "всделке",
    "сподбором",
  ];
  const gluedWords = new Set();
  const patterns = [
    /\bи[а-яА-ЯёЁ]{3,}\b/g,
    /\bв[а-яА-ЯёЁ]{3,}\b/g,
    /\bс[а-яА-ЯёЁ]{3,}\b/g,
    /\bк[а-яА-ЯёЁ]{3,}\b/g,
    /\bна[а-яА-ЯёЁ]{3,}\b/g,
    /\bпо[а-яА-ЯёЁ]{3,}\b/g,
  ];

  for (const word of explicitSuspiciousWords) {
    if (text.toLowerCase().includes(word)) {
      gluedWords.add(word);
    }
  }

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      gluedWords.add(match[0]);
    }
  }

  return Array.from(gluedWords);
}

function buildComments(scores, decision, qualityFlags = {}) {
  const comments = [];

  if (qualityFlags.gluedWords?.length) {
    comments.push(`Найдены возможные склеенные слова: ${qualityFlags.gluedWords.join(", ")}.`);
  }

  if (scores.hook < 8) comments.push("Усилить первую строку: быстрее показать проблему или выгоду.");
  if (scores.emotion < 8) comments.push("Добавить больше эмоционального образа: спокойствие, уверенность, комфорт.");
  if (scores.trust < 8) comments.push("Чётче раскрыть проверку, прозрачность и сопровождение.");
  if (scores.cta < 8) comments.push("CTA сделать более конкретным и спокойным.");
  if (scores.brand < 8) comments.push("Сильнее связать текст с AutoVector и авто из Азии.");
  if (scores.readability < 8) comments.push("Упростить структуру и разбить текст на короткие блоки.");
  if (comments.length === 0) comments.push("Текст готов к публикационной подготовке.");

  comments.push(decision === "approved" ? "Decision: approved." : "Decision: needs_revision.");

  return comments;
}

function reviewContent(content) {
  const qualityFlags = {
    gluedWords: detectGluedWords(content),
  };
  const scores = {
    hook: scoreHook(content),
    emotion: scoreEmotion(content),
    trust: scoreTrust(content),
    cta: scoreCta(content),
    brand: scoreBrand(content),
    readability: scoreReadability(content),
  };

  if (qualityFlags.gluedWords.length) {
    scores.readability = Math.min(scores.readability, 5);
  }

  const rawOverall = Number((
    Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.values(scores).length
  ).toFixed(1));
  const overall = qualityFlags.gluedWords.length ? Math.min(rawOverall, 7.9) : rawOverall;
  const decision = qualityFlags.gluedWords.length || overall < 8 ? "needs_revision" : "approved";

  return {
    overall,
    ...scores,
    decision,
    comments: buildComments(scores, decision, qualityFlags),
    qualityFlags,
    reviewedBy: "creative_director_v1",
    reviewedAt: new Date().toISOString(),
  };
}

function getDraftTimestamp(item) {
  const value = item.createdAt || item.updatedAt || item.plannedDate || "";
  const timestamp = Date.parse(value);

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function findFreshDraftIndex(queue) {
  const candidates = queue
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.status === "draft" && !item.review);

  if (candidates.length === 0) return -1;

  return candidates
    .sort((left, right) => {
      const timestampDiff = getDraftTimestamp(right.item) - getDraftTimestamp(left.item);
      if (timestampDiff !== 0) return timestampDiff;

      return right.index - left.index;
    })[0].index;
}

function main() {
  const queue = readJson(CONTENT_QUEUE_PATH);
  const targetIndex = findFreshDraftIndex(queue);

  if (targetIndex === -1) {
    console.log("Creative Director Agent: no fresh draft content found.");
    return;
  }

  const target = queue[targetIndex];
  const review = reviewContent(target);

  queue[targetIndex] = {
    ...target,
    status: review.decision,
    review,
  };

  writeJson(CONTENT_QUEUE_PATH, queue);

  console.log(`Creative Director Agent: reviewed ${target.id}`);
  console.log(`Creative Director Agent: overall ${review.overall}`);
  console.log(`Creative Director Agent: decision ${review.decision}`);
}

main();
