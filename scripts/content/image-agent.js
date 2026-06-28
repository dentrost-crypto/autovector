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

function main() {
  const queue = readJson(CONTENT_QUEUE_PATH);
  const targetIndex = queue.findIndex((item) =>
    item.status === "draft" &&
    item.image === null &&
    typeof item.imagePrompt === "string" &&
    item.imagePrompt.trim(),
  );

  if (targetIndex === -1) {
    console.log("Image Agent: no draft content with empty image and imagePrompt found.");
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
