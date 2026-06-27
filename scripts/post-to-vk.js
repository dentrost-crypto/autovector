const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const CONTENT_QUEUE_PATH = path.join(ROOT_DIR, "app", "data", "content_queue.json");

const VK_ACCESS_TOKEN = process.env.VK_ACCESS_TOKEN;
const VK_GROUP_ID = process.env.VK_GROUP_ID || "239860693";
const VK_API_VERSION = process.env.VK_API_VERSION || "5.131";

function readContentQueue() {
  const raw = fs.readFileSync(CONTENT_QUEUE_PATH, "utf8");
  return JSON.parse(raw);
}

function writeContentQueue(queue) {
  fs.writeFileSync(CONTENT_QUEUE_PATH, `${JSON.stringify(queue, null, 2)}\n`, "utf8");
}

function normalizeTag(tag) {
  const value = String(tag || "").trim();
  if (!value) return "";
  return value.startsWith("#") ? value : `#${value.replace(/\s+/g, "_")}`;
}

function buildVkPostText(content) {
  const parts = [content.title, content.cta];
  const tags = Array.isArray(content.tags)
    ? content.tags.map(normalizeTag).filter(Boolean).join(" ")
    : "";

  if (tags) {
    parts.push(tags);
  }

  return parts.filter(Boolean).join("\n\n");
}

function findApprovedVkContent(queue) {
  return queue.find(
    (content) =>
      String(content.channel || "").toLowerCase() === "vk" &&
      String(content.status || "").toLowerCase() === "approved",
  );
}

async function publishTextPostToVk(message) {
  if (!VK_ACCESS_TOKEN) {
    throw new Error("Missing VK_ACCESS_TOKEN");
  }

  if (!VK_GROUP_ID) {
    throw new Error("Missing VK_GROUP_ID");
  }

  const groupId = String(VK_GROUP_ID).replace(/^-/, "");
  const ownerId = `-${groupId}`;

  const body = new URLSearchParams({
    access_token: VK_ACCESS_TOKEN,
    v: VK_API_VERSION,
    owner_id: ownerId,
    from_group: "1",
    message,
  });

  const response = await fetch("https://api.vk.com/method/wall.post", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`VK API HTTP error: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();

  if (payload.error) {
    const error = payload.error;
    throw new Error(
      `VK API error ${error.error_code}: ${error.error_msg || "Unknown VK error"}`,
    );
  }

  const postId = payload.response?.post_id;
  if (!postId) {
    throw new Error("VK API response does not contain post_id");
  }

  return {
    postId,
    publishedUrl: `https://vk.com/wall${ownerId}_${postId}`,
  };
}

async function main() {
  const queue = readContentQueue();
  const content = findApprovedVkContent(queue);

  if (!content) {
    console.log("No approved VK content found.");
    return;
  }

  const message = buildVkPostText(content);

  console.log(`VK publisher: selected ${content.id}`);
  console.log(`VK group id: ${VK_GROUP_ID}`);
  console.log(`Message length: ${message.length}`);

  try {
    const result = await publishTextPostToVk(message);
    const now = new Date().toISOString();

    const updatedQueue = queue.map((item) =>
      item.id === content.id
        ? {
            ...item,
            status: "published",
            publishedAt: now,
            publishedUrl: result.publishedUrl,
          }
        : item,
    );

    writeContentQueue(updatedQueue);

    console.log(`VK post published: ${result.publishedUrl}`);
  } catch (error) {
    console.error(`VK publish failed: ${error.message}`);
    process.exitCode = 1;
  }
}

main();
