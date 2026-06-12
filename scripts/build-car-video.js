const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const CARS_PATH = path.join(ROOT_DIR, "app", "data", "cars.json");
const OUTPUT_DIR = path.join(ROOT_DIR, "public", "generated", "videos");
const HISTORY_PATH = path.join(OUTPUT_DIR, "brand-video-history.json");
const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;
const TOTAL_DURATION = 13;
const TRANSITION_DURATION = 1;
const MAX_IMAGES = 5;
const FFMPEG_BIN = process.env.FFMPEG_PATH || "ffmpeg";

const TRIGGERS = {
  status: [
    "ПРЕМИАЛЬНЫЙ СТИЛЬ",
    "ПРЕСТИЖ",
    "ЭЛЕГАНТНОСТЬ",
    "СТАТУСНЫЙ ВЫБОР",
    "СОВРЕМЕННЫЙ ОБРАЗ",
    "АВТО С ХАРАКТЕРОМ",
    "УРОВЕНЬ ВЫШЕ",
    "ВЫГЛЯДИТ ДОСТОЙНО",
  ],
  reliability: [
    "ПРОВЕРЕННАЯ НАДЁЖНОСТЬ",
    "НАДЁЖНЫЙ ВЫБОР",
    "СПОКОЙСТВИЕ В ПУТИ",
    "УВЕРЕННОСТЬ КАЖДЫЙ ДЕНЬ",
    "ПРОВЕРЕНО ВРЕМЕНЕМ",
    "БЕЗ ЛИШНИХ ЗАБОТ",
  ],
  comfort: [
    "КОМФОРТ КАЖДЫЙ ДЕНЬ",
    "ПРОСТОРНЫЙ САЛОН",
    "УЮТ В ПОЕЗДКЕ",
    "ПРАКТИЧНОСТЬ",
    "СВОБОДА ДВИЖЕНИЯ",
    "СЕМЕЙНЫЙ КОМФОРТ",
  ],
  dynamics: [
    "УВЕРЕННАЯ ДИНАМИКА",
    "ЛЁГКОЕ УПРАВЛЕНИЕ",
    "ДРАЙВ КАЖДЫЙ ДЕНЬ",
    "МАНЕВРЕННОСТЬ",
    "ХАРАКТЕР В ДВИЖЕНИИ",
    "УДОВОЛЬСТВИЕ ЗА РУЛЁМ",
  ],
  tech: [
    "ВЫСОКИЕ ТЕХНОЛОГИИ",
    "СМАРТ-СИСТЕМЫ",
    "СОВРЕМЕННЫЕ РЕШЕНИЯ",
    "ПРОДУМАННАЯ ЭРГОНОМИКА",
    "ТЕХНОЛОГИИ КОМФОРТА",
  ],
  freedom: [
    "СВОБОДА ДВИЖЕНИЯ",
    "БОЛЬШЕ МАРШРУТОВ",
    "ЛЕГКО СОРВАТЬСЯ",
    "ДОРОГА ЗОВЁТ",
    "БЕЗ ГРАНИЦ",
  ],
  space: [
    "БОЛЬШЕ ПРОСТРАНСТВА",
    "ПРОСТОР ДЛЯ СЕМЬИ",
    "УДОБНО КАЖДЫЙ ДЕНЬ",
    "МЕСТА ХВАТИТ",
    "ПРАКТИЧНЫЙ ФОРМАТ",
  ],
  travel: [
    "ГОТОВ К ПОЕЗДКАМ",
    "ВЫХОДНЫЕ ЗА ГОРОДОМ",
    "ПУТЕШЕСТВИЯ БЛИЖЕ",
    "МАРШРУТ СВОБОДЫ",
    "ДАЛЬШЕ ОТ СУЕТЫ",
  ],
  practicality: [
    "ПРАКТИЧНЫЙ ВЫБОР",
    "РАЗУМНЫЕ РАСХОДЫ",
    "ЛЕГКО ВЛАДЕТЬ",
    "НА КАЖДЫЙ ДЕНЬ",
    "ПОНЯТНАЯ ВЫГОДА",
  ],
};

function parseCarId() {
  const idArg = process.argv.find((arg) => arg.startsWith("--id="));
  const id = Number(idArg ? idArg.split("=")[1] : process.env.CAR_ID || 4);

  return Number.isInteger(id) && id > 0 ? id : 4;
}

function runFfmpeg(args, options = {}) {
  return spawnSync(FFMPEG_BIN, args, {
    encoding: "utf8",
    stdio: "pipe",
    windowsHide: true,
    ...options,
  });
}

function assertFfmpeg() {
  const result = runFfmpeg(["-version"]);

  if (result.error || result.status !== 0) {
    throw new Error("ffmpeg is required to build videos");
  }
}

function getLocalImages(carId) {
  const carDir = path.join(ROOT_DIR, "public", "uploads", "cars", String(carId));

  if (!fs.existsSync(carDir)) {
    return [];
  }

  return fs
    .readdirSync(carDir)
    .filter((file) => /\.(webp|jpe?g|png)$/i.test(file))
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
    .slice(0, MAX_IMAGES)
    .map((file) => path.join(carDir, file));
}

function getDurationSeconds() {
  return TOTAL_DURATION;
}

function getImageDuration(imageCount) {
  return (TOTAL_DURATION + TRANSITION_DURATION * (imageCount - 1)) / imageCount;
}

function getSlideFrames(imageCount) {
  return Math.round(getImageDuration(imageCount) * FPS);
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

function calculateRussiaPrice(priceCny) {
  return parsePriceNumber(priceCny) * 10.5 + 900000;
}

function formatMillionPrice(price) {
  const millions = price / 1000000;

  return `ОТ ${millions.toFixed(2)} МЛН ₽`;
}

function buildImageFilter(imageCount) {
  const slides = [];
  const transitions = [];
  const imageDuration = getImageDuration(imageCount);
  const slideFrames = getSlideFrames(imageCount);

  for (let index = 0; index < imageCount; index += 1) {
    const zoomStep = index % 2 === 0 ? "0.00042" : "0.00034";
    const panX = index % 2 === 0 ? "iw/2-(iw/zoom/2)" : "iw/2-(iw/zoom/2)-iw*0.018";
    const panY = index % 2 === 0 ? "ih/2-(ih/zoom/2)-ih*0.014" : "ih/2-(ih/zoom/2)+ih*0.014";

    slides.push(
      [
        `[${index}:v]`,
        `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,`,
        `crop=${WIDTH}:${HEIGHT},`,
        `zoompan=z='min(zoom+${zoomStep},1.06)':x='${panX}':y='${panY}':d=${slideFrames}:s=${WIDTH}x${HEIGHT}:fps=${FPS},`,
        "setsar=1,format=yuv420p",
        `[v${index}]`,
      ].join("")
    );
  }

  let previous = "[v0]";
  for (let index = 1; index < imageCount; index += 1) {
    const output = index === imageCount - 1 ? "[basev]" : `[x${index}]`;
    const offset = Number(((imageDuration - TRANSITION_DURATION) * index).toFixed(3));

    transitions.push(
      `${previous}[v${index}]xfade=transition=fade:duration=${TRANSITION_DURATION}:offset=${offset}${output}`
    );
    previous = output;
  }

  return [...slides, ...transitions].join(";");
}

function getBrand(car) {
  const text = `${car.modelName || ""} ${car.title || ""}`.toLowerCase();

  if (text.includes("bmw")) return "bmw";
  if (text.includes("audi")) return "audi";
  if (text.includes("mercedes")) return "mercedes";
  if (text.includes("toyota")) return "toyota";
  if (text.includes("honda")) return "honda";
  if (text.includes("nissan")) return "nissan";

  return "default";
}

function isCrossover(car) {
  const text = `${car.modelName || ""} ${car.title || ""}`.toLowerCase();

  return /\b(x1|x3|x5|rav4|cr-v|crv|qashqai|x-trail|suv|crossover)\b/.test(text);
}

function getTriggerCategories(car) {
  if (isCrossover(car)) {
    return ["freedom", "space", "travel"];
  }

  const brand = getBrand(car);

  if (["bmw", "audi", "mercedes"].includes(brand)) {
    return ["status", "dynamics", "comfort"];
  }

  if (["toyota", "honda", "nissan"].includes(brand)) {
    return ["reliability", "comfort", "practicality"];
  }

  return ["comfort", "reliability", "practicality"];
}

function readHistory() {
  if (!fs.existsSync(HISTORY_PATH)) {
    return { lastTriggers: [], builds: [] };
  }

  try {
    return JSON.parse(fs.readFileSync(HISTORY_PATH, "utf8"));
  } catch {
    return { lastTriggers: [], builds: [] };
  }
}

function writeHistory(history) {
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
}

function pickTrigger(category, index, history) {
  const words = TRIGGERS[category] || TRIGGERS.comfort;
  const last = Array.isArray(history.lastTriggers) ? history.lastTriggers : [];
  const offset = ((history.builds || []).length + index) % words.length;
  const ordered = [...words.slice(offset), ...words.slice(0, offset)];
  const picked = ordered.find((word) => !last.includes(word)) || ordered[0];
  const replaced = last.includes(words[offset])
    ? { from: words[offset], to: picked, category }
    : null;

  return { value: picked, replaced };
}

function selectTriggers(car, history) {
  const categories = getTriggerCategories(car);
  const selected = [];
  const replacements = [];

  for (let index = 0; index < categories.length; index += 1) {
    const result = pickTrigger(categories[index], index, history);
    selected.push(result.value);

    if (result.replaced) {
      replacements.push(result.replaced);
    }
  }

  const unique = Array.from(new Set(selected)).slice(0, 3);

  return {
    triggers: unique,
    replacements,
    categories,
  };
}

function updateHistory(carId, triggerInfo) {
  const history = readHistory();
  const build = {
    carId,
    triggers: triggerInfo.triggers,
    createdAt: new Date().toISOString(),
  };

  history.lastTriggers = triggerInfo.triggers;
  history.builds = [build, ...(history.builds || [])].slice(0, 20);
  writeHistory(history);
}

function getModelTitle(car) {
  const text = `${car.modelName || car.title || `AUTO ${car.id}`}`.toUpperCase();

  if (text.includes("BMW") && text.includes("X1")) return "BMW X1";
  if (text.includes("BMW") && /1\s*(SERIES|СЕРИИ)/i.test(text)) return "BMW 1 SERIES";
  if (text.includes("TOYOTA") && text.includes("COROLLA")) return "TOYOTA COROLLA";

  return text
    .replace(/\s+\d{4}.*$/i, "")
    .replace(/\s+M SPORT.*$/i, "")
    .trim()
    .slice(0, 28);
}

function assTime(seconds) {
  const centiseconds = Math.round(seconds * 100);
  const cs = centiseconds % 100;
  const totalSeconds = Math.floor(centiseconds / 100);
  const s = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const m = totalMinutes % 60;
  const h = Math.floor(totalMinutes / 60);

  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

function assText(value) {
  return String(value).replace(/[{}]/g, "").replace(/\n/g, "\\N");
}

function splitTriggerLines(text) {
  const words = String(text).trim().split(/\s+/).filter(Boolean);

  if (words.length <= 2) {
    return [words.join(" ")];
  }

  let bestIndex = 1;
  let bestScore = Infinity;

  for (let index = 1; index < words.length; index += 1) {
    const first = words.slice(0, index).join(" ");
    const second = words.slice(index).join(" ");
    const score = Math.abs(first.length - second.length);

    if (score < bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }

  return [
    words.slice(0, bestIndex).join(" "),
    words.slice(bestIndex).join(" "),
  ].filter(Boolean);
}

function dialogue({ start, end, style, text, fade = true, override = "" }) {
  const prefix = `{${[fade ? "\\fad(360,260)" : "", override]
    .filter(Boolean)
    .join("")}}`;

  return `Dialogue: 0,${assTime(start)},${assTime(end)},${style},,0,0,0,,${prefix}${assText(text)}`;
}

function triggerDialogues({ start, end, text }) {
  const lines = splitTriggerLines(text);

  if (lines.length === 1) {
    return [
      dialogue({
        start,
        end,
        style: "Trigger",
        text: lines[0],
        override: "\\pos(540,850)",
      }),
    ];
  }

  return [
    dialogue({
      start,
      end,
      style: "Trigger",
      text: lines[0],
      override: "\\pos(540,790)",
    }),
    dialogue({
      start,
      end,
      style: "Trigger",
      text: lines[1],
      override: "\\pos(540,940)",
    }),
  ];
}

function createAssFile({ car, triggerInfo }) {
  const assPath = path.join(OUTPUT_DIR, `car-${car.id}.ass`);
  const modelTitle = getModelTitle(car);
  const [mainTrigger, secondTrigger, thirdTrigger] = triggerInfo.triggers;
  const price = formatMillionPrice(calculateRussiaPrice(car.price));
  const triggerEvents = [
    ...triggerDialogues({ start: 3.15, end: 5.6, text: mainTrigger }),
    ...triggerDialogues({ start: 5.75, end: 8.2, text: secondTrigger }),
    ...triggerDialogues({ start: 8.35, end: 10.8, text: thirdTrigger }),
  ];
  const lines = [
    "[Script Info]",
    "ScriptType: v4.00+",
    "WrapStyle: 0",
    "ScaledBorderAndShadow: yes",
    `PlayResX: ${WIDTH}`,
    `PlayResY: ${HEIGHT}`,
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    "Style: Logo,Arial Black,104,&H0000D0FF,&H0000D0FF,&HAA000000,&H00000000,-1,0,0,0,100,100,1,0,1,6,5,8,70,70,76,1",
    "Style: Hero,Arial Black,124,&H0000D0FF,&H0000D0FF,&HAA000000,&H00000000,-1,0,0,0,100,100,1,0,1,8,6,5,90,90,0,1",
    "Style: Trigger,Arial Black,114,&H00FFFFFF,&H00FFFFFF,&HBB000000,&H00000000,-1,0,0,0,100,100,1,0,1,9,7,5,90,90,0,1",
    "Style: Price,Arial Black,166,&H0000D0FF,&H0000D0FF,&HBB000000,&H00000000,-1,0,0,0,100,100,1,0,1,10,8,5,90,90,0,1",
    "Style: Final,Arial Black,66,&H0000D0FF,&H0000D0FF,&HAA000000,&H00000000,-1,0,0,0,100,100,1,0,1,6,4,2,90,90,190,1",
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    dialogue({ start: 0, end: TOTAL_DURATION, style: "Logo", text: "AutoVector" }),
    dialogue({ start: 0.6, end: 3.1, style: "Hero", text: modelTitle, override: "\\pos(540,820)" }),
    ...triggerEvents,
    dialogue({ start: 10.9, end: TOTAL_DURATION, style: "Price", text: price, override: "\\pos(540,735)" }),
    dialogue({
      start: 11.55,
      end: TOTAL_DURATION,
      style: "Final",
      text: "AUTOVECTOR\\NАвто из Китая, Кореи и Японии\\NAUTOVECTOR.PRO",
    }),
  ];

  fs.writeFileSync(assPath, `${lines.join("\n")}\n`, "utf8");

  return assPath;
}

function escapeFilterPath(filePath) {
  return path.relative(ROOT_DIR, filePath).replace(/\\/g, "/").replace(/'/g, "\\'");
}

function buildFilter(imageCount, assPath) {
  const imageFilter = buildImageFilter(imageCount);
  const subtitlesFilter = `[basev]eq=brightness=-0.035:contrast=1.04,subtitles='${escapeFilterPath(assPath)}'[outv]`;

  return `${imageFilter};${subtitlesFilter}`;
}

function main() {
  assertFfmpeg();

  const carId = parseCarId();
  const cars = JSON.parse(fs.readFileSync(CARS_PATH, "utf8"));
  const car = cars.find((item) => item.id === carId);

  if (!car) {
    throw new Error(`Car ID ${carId} not found in app/data/cars.json`);
  }

  const images = getLocalImages(carId);

  if (images.length < 2) {
    throw new Error(
      `Need at least 2 local photos for car ID ${carId}. Found ${images.length}.`
    );
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const history = readHistory();
  const triggerInfo = selectTriggers(car, history);
  const assPath = createAssFile({ car, triggerInfo });
  const outputPath = path.join(OUTPUT_DIR, `car-${carId}.mp4`);
  const imageDuration = getImageDuration(images.length);
  const args = [];

  for (const image of images) {
    args.push("-loop", "1", "-t", imageDuration.toFixed(3), "-i", image);
  }

  args.push(
    "-filter_complex",
    buildFilter(images.length, assPath),
    "-map",
    "[outv]",
    "-t",
    String(getDurationSeconds()),
    "-r",
    String(FPS),
    "-an",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-y",
    outputPath
  );

  const result = runFfmpeg(args);

  if (result.status !== 0) {
    throw new Error(`ffmpeg failed:\n${result.stderr || result.stdout}`);
  }

  updateHistory(carId, triggerInfo);

  const stats = fs.statSync(outputPath);

  console.log("Brand video created");
  console.log(`Output: ${outputPath}`);
  console.log("Photos:");
  for (const image of images) {
    console.log(`- ${image}`);
  }
  console.log(`Duration: ${getDurationSeconds()}s`);
  console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log("Emotional triggers:");
  for (const trigger of triggerInfo.triggers) {
    console.log(`- ${trigger}`);
  }
  console.log("Trigger replacements:");
  if (triggerInfo.replacements.length === 0) {
    console.log("- none");
  } else {
    for (const replacement of triggerInfo.replacements) {
      console.log(`- ${replacement.category}: ${replacement.from} -> ${replacement.to}`);
    }
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
