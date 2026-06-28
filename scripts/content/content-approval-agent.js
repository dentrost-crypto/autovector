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

function isVkDraftReady(item) {
  return (
    item.status === "draft" &&
    typeof item.text === "string" &&
    item.text.trim() &&
    typeof item.image === "string" &&
    item.image.trim() &&
    Array.isArray(item.platforms) &&
    item.platforms.includes("vk")
  );
}

function main() {
  const queue = readJson(CONTENT_QUEUE_PATH);
  const targetIndex = queue.findIndex(isVkDraftReady);

  if (targetIndex === -1) {
    console.log("Content Approval Agent: no ready VK draft found.");
    return;
  }

  const now = new Date().toISOString();
  const target = queue[targetIndex];

  queue[targetIndex] = {
    ...target,
    status: "approved",
    approvedBy: "human_manual_approval",
    approvedAt: now,
  };

  writeJson(CONTENT_QUEUE_PATH, queue);

  console.log(`Content Approval Agent: approved ${target.id}`);
  console.log(`Content Approval Agent: approvedAt ${now}`);
  console.log("Content Approval Agent: no publishing was performed.");
}

main();
