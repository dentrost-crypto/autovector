const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const CONTENT_QUEUE_PATH = path.join(ROOT_DIR, "app", "data", "content_queue.json");
const PLACEHOLDER_IMAGE = "public/posts/test-vk-image.png";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function getContentTimestamp(item) {
  const value = item.approvedAt || item.createdAt || item.updatedAt || item.plannedDate || "";
  const timestamp = Date.parse(value);

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function findFreshImageTargetIndex(queue) {
  const candidates = queue
    .map((item, index) => ({ item, index }))
    .filter(({ item }) =>
      ["draft", "approved"].includes(item.status) &&
      item.image === null &&
      typeof item.imagePrompt === "string" &&
      item.imagePrompt.trim(),
    );

  if (candidates.length === 0) return -1;

  return candidates
    .sort((left, right) => {
      const timestampDiff = getContentTimestamp(right.item) - getContentTimestamp(left.item);
      if (timestampDiff !== 0) return timestampDiff;

      return right.index - left.index;
    })[0].index;
}

function main() {
  const queue = readJson(CONTENT_QUEUE_PATH);
  const targetIndex = findFreshImageTargetIndex(queue);

  if (targetIndex === -1) {
    console.log("Image Agent: no draft/approved content with empty image and imagePrompt found.");
    return;
  }

  const now = new Date().toISOString();
  const target = queue[targetIndex];

  queue[targetIndex] = {
    ...target,
    image: PLACEHOLDER_IMAGE,
    imageGeneratedBy: "image_agent_v1_placeholder",
    imageUpdatedAt: now,
  };

  writeJson(CONTENT_QUEUE_PATH, queue);

  console.log(`Image Agent: updated ${target.id}`);
  console.log(`Image Agent: image ${PLACEHOLDER_IMAGE}`);
}

main();
