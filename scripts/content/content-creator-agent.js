const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const CONTENT_QUEUE_PATH = path.join(ROOT_DIR, "app", "data", "content_queue.json");

const CONTENT_TYPES = ["expert", "emotional", "case", "myth_busting", "checklist"];

const CONTENT_TEMPLATES = {
  expert: {
    topic: "Как AutoVector снижает риски при покупке автомобиля из Азии",
    text: [
      "Главный вопрос при покупке автомобиля из Азии - не только цена. Важно понимать состояние машины, историю, реальные расходы и этапы сделки.",
      "AutoVector помогает пройти этот путь спокойно: подбираем варианты, проверяем данные, показываем фото до покупки и заранее объясняем, из чего складывается итоговая стоимость.",
      "Так клиент принимает решение не вслепую, а с понятной картиной по автомобилю, срокам и бюджету.",
    ].join("\n\n"),
    cta: "Напишите нам - разберём ваш бюджет и покажем, какие варианты стоит рассматривать.",
    hashtags: ["AutoVector", "автоподбор", "автоизазии", "проверкаавто", "автоподключ"],
    imagePrompt:
      "Premium automotive concierge scene, consultant showing vehicle inspection details to a calm client near a modern BMW or Lexus, dark elegant style, trust and transparency.",
  },
  emotional: {
    topic: "Момент, когда автомобиль уже ощущается вашим",
    text: [
      "Представьте момент, когда вы впервые видите себя за рулём нового автомобиля: спокойная поездка по городу, семейный маршрут на выходные, уверенность на трассе.",
      "AutoVector берёт на себя сложную часть покупки, чтобы у клиента оставалось главное - выбрать автомобиль, который подходит по стилю жизни и вызывает желание сесть за руль.",
      "Мы сопровождаем процесс внимательно и без давления, от первого запроса до понятного следующего шага.",
    ].join("\n\n"),
    cta: "Оставьте заявку - подберём автомобиль под ваши задачи, темп жизни и бюджет.",
    hashtags: ["AutoVector", "автоподбор", "автодлясемьи", "автоизкитая", "автоизкореи"],
    imagePrompt:
      "Emotional premium lifestyle photo, client receiving car keys near a beautiful modern crossover, calm family mood, elegant dark AutoVector brand atmosphere.",
  },
  case: {
    topic: "Мини-кейс: когда клиенту нужен был понятный семейный автомобиль",
    text: [
      "Клиент хотел свежий автомобиль для семьи, но сомневался: разные рынки, непонятные комплектации, риски по состоянию и итоговой цене.",
      "AutoVector помог сравнить несколько вариантов, отсечь слабые предложения и оставить те машины, по которым можно было спокойно принимать решение.",
      "В такой покупке важен не только сам автомобиль. Важно, чтобы клиент понимал, за что платит и какой путь проходит сделка.",
    ].join("\n\n"),
    cta: "Напишите менеджеру - разберём вашу задачу и предложим понятные варианты.",
    hashtags: ["AutoVector", "кейсподбора", "семейныйавто", "автоизазии", "подбормашины"],
    imagePrompt:
      "Premium family car purchase consultation, consultant and couple reviewing documents near a modern SUV, calm serious mood, trust, no aggressive sales.",
  },
  myth_busting: {
    topic: "Миф: автомобиль из Азии невозможно нормально проверить",
    text: [
      "На самом деле риск появляется не потому, что автомобиль из Китая, Кореи или Японии. Риск появляется, когда покупатель не видит деталей и принимает решение по красивому объявлению.",
      "AutoVector смотрит на автомобиль как на сделку целиком: состояние, фото, комплектацию, расчёт, логистику и понятность каждого этапа.",
      "Хороший подбор - это не обещания. Это прозрачная информация до того, как клиент принимает решение.",
    ].join("\n\n"),
    cta: "Хотите проверить конкретный вариант? Пришлите ссылку или запрос - посмотрим вместе.",
    hashtags: ["AutoVector", "мифыобавто", "проверкаавто", "автоизяпонии", "автоизкитая"],
    imagePrompt:
      "Dark premium automotive inspection scene, expert checking a vehicle with tablet and documents, modern dealership mood, transparent car buying process.",
  },
  checklist: {
    topic: "Чек-лист перед покупкой автомобиля из Азии",
    text: [
      "Перед покупкой автомобиля важно проверить не только цену в объявлении.",
      "Что стоит уточнить заранее:",
      "1. Реальное состояние и фото автомобиля.",
      "2. Пробег, год, комплектацию и историю.",
      "3. Итоговую стоимость под ключ в России.",
      "4. Сроки доставки и порядок оплаты.",
      "5. Кто сопровождает сделку на каждом этапе.",
      "AutoVector помогает собрать эти ответы в одну понятную картину, чтобы решение было спокойным и взвешенным.",
    ].join("\n"),
    cta: "Напишите нам - подготовим подбор и расчёт под ваш бюджет.",
    hashtags: ["AutoVector", "чеклистпокупки", "автоподбор", "автоизазии", "автоподключ"],
    imagePrompt:
      "Premium checklist style image, car buying consultant reviewing vehicle documents with client near a modern premium car, dark clean business atmosphere.",
  },
};

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

function getNextContentType(queue) {
  const createdPosts = queue.filter(
    (item) =>
      item.createdBy === "content_creator_agent" &&
      CONTENT_TYPES.includes(item.contentType)
  );

  if (!createdPosts.length) {
    return CONTENT_TYPES[0];
  }

  const lastPost = createdPosts[createdPosts.length - 1];
  const lastIndex = CONTENT_TYPES.indexOf(lastPost.contentType);

  return CONTENT_TYPES[(lastIndex + 1) % CONTENT_TYPES.length];
}

function createAutoVectorVkDraft(id, contentType) {
  const createdAt = new Date().toISOString();
  const template = CONTENT_TEMPLATES[contentType];

  return {
    id,
    type: "social_post",
    platforms: ["vk"],
    status: "draft",
    contentType,
    topic: template.topic,
    text: template.text,
    cta: template.cta,
    hashtags: template.hashtags,
    imagePrompt: template.imagePrompt,
    image: null,
    createdBy: "content_creator_agent",
    createdAt,
  };
}

function main() {
  const queue = readJson(CONTENT_QUEUE_PATH);
  const nextId = getNextContentId(queue);
  const contentType = getNextContentType(queue);
  const draft = createAutoVectorVkDraft(nextId, contentType);

  queue.push(draft);
  writeJson(CONTENT_QUEUE_PATH, queue);

  console.log(`Content Creator Agent: created ${nextId}`);
  console.log(`Content Creator Agent: content type ${contentType}`);
  console.log("Content Creator Agent: status draft");
  console.log("Content Creator Agent: Publisher Agent will not publish this until status is approved.");
}

main();
