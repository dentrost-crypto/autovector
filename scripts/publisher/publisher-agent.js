const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const CONTENT_QUEUE_PATH = path.join(ROOT_DIR, "app", "data", "content_queue.json");
const PAYLOAD_PATH = path.join(ROOT_DIR, "temp", "publish-payload.json");
const FALLBACK_IMAGE_PATH = "public/posts/test-vk-image.png";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function normalizePlatform(value) {
  return String(value || "").trim().toLowerCase();
}

function isVkContent(item) {
  const platform = normalizePlatform(item.platform);
  const channel = normalizePlatform(item.channel);
  const platforms = Array.isArray(item.platforms)
    ? item.platforms.map(normalizePlatform)
    : [];

  return platform === "vk" || channel === "vk" || platforms.includes("vk");
}

function pickFirstString(item, keys) {
  for (const key of keys) {
    if (typeof item[key] === "string" && item[key].trim()) {
      return item[key].trim();
    }
  }

  return "";
}

function normalizeTag(tag) {
  const value = String(tag || "").trim();
  if (!value) return "";
  return value.startsWith("#") ? value : `#${value.replace(/\s+/g, "_")}`;
}

function buildText(item) {
  const explicitText = pickFirstString(item, [
    "text",
    "content",
    "body",
    "caption",
    "message",
    "description",
  ]);

  if (explicitText) return explicitText;

  const parts = [
    pickFirstString(item, ["title"]),
    pickFirstString(item, ["cta"]),
  ];

  const tags = Array.isArray(item.tags)
    ? item.tags.map(normalizeTag).filter(Boolean).join(" ")
    : "";

  if (tags) parts.push(tags);

  return parts.filter(Boolean).join("\n\n");
}

function pickImage(item) {
  const directImage = pickFirstString(item, [
    "image",
    "imagePath",
    "assetPath",
    "media",
    "mediaPath",
  ]);

  if (directImage) return directImage;

  if (Array.isArray(item.media)) {
    const imageMedia = item.media.find((mediaItem) => {
      if (typeof mediaItem === "string") return mediaItem.trim();
      return pickFirstString(mediaItem, ["path", "image", "imagePath", "assetPath", "url"]);
    });

    if (typeof imageMedia === "string") return imageMedia.trim();
    if (imageMedia) {
      return pickFirstString(imageMedia, ["path", "image", "imagePath", "assetPath", "url"]);
    }
  }

  if (item.imageRequired && fs.existsSync(path.join(ROOT_DIR, FALLBACK_IMAGE_PATH))) {
    return FALLBACK_IMAGE_PATH;
  }

  return "";
}

function findApprovedVkPost(queue) {
  return queue.find((item) => {
    const status = normalizePlatform(item.status);
    return status === "approved" && isVkContent(item);
  });
}

function main() {
  const queue = readJson(CONTENT_QUEUE_PATH);
  const item = findApprovedVkPost(queue);

  if (!item) {
    throw new Error("No approved VK content found in app/data/content_queue.json");
  }

  const text = buildText(item);
  const image = pickImage(item);

  if (!text) {
    throw new Error(`Approved VK content ${item.id || "(no id)"} does not contain publishable text`);
  }

  const payload = {
    id: item.id,
    platform: "vk",
    text,
    image,
    status: "ready",
  };

  writeJson(PAYLOAD_PATH, payload);

  console.log(`Publisher Agent: selected ${payload.id}`);
  console.log(`Publisher Agent: platform ${payload.platform}`);
  console.log(`Publisher Agent: text length ${payload.text.length}`);
  console.log(`Publisher Agent: image ${payload.image || "(none)"}`);
  console.log(`Publisher Agent: payload written to ${path.relative(ROOT_DIR, PAYLOAD_PATH)}`);
}

main();
