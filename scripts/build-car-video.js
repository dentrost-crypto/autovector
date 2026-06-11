const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const CARS_PATH = path.join(ROOT_DIR, "app", "data", "cars.json");
const OUTPUT_DIR = path.join(ROOT_DIR, "public", "generated", "videos");
const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;
const IMAGE_DURATION = 4;
const TRANSITION_DURATION = 1;
const FFMPEG_BIN = process.env.FFMPEG_PATH || "ffmpeg";

function parseCarId() {
  const idArg = process.argv.find((arg) => arg.startsWith("--id="));
  const id = Number(idArg ? idArg.split("=")[1] : process.env.CAR_ID || 4);

  return Number.isInteger(id) && id > 0 ? id : 4;
}

function assertFfmpeg() {
  const result = spawnSync(FFMPEG_BIN, ["-version"], {
    encoding: "utf8",
    windowsHide: true,
  });

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
    .slice(0, 4)
    .map((file) => path.join(carDir, file));
}

function buildFilter(imageCount) {
  const slides = [];
  const transitions = [];
  const slideFrames = IMAGE_DURATION * FPS;

  for (let index = 0; index < imageCount; index += 1) {
    const zoomDirection = index % 2 === 0 ? "zoom+0.00045" : "zoom+0.00035";
    const panX = index % 2 === 0 ? "iw/2-(iw/zoom/2)" : "iw/2-(iw/zoom/2)-iw*0.015";
    const panY = index % 2 === 0 ? "ih/2-(ih/zoom/2)-ih*0.012" : "ih/2-(ih/zoom/2)+ih*0.012";

    slides.push(
      [
        `[${index}:v]`,
        `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,`,
        `crop=${WIDTH}:${HEIGHT},`,
        `zoompan=z='min(${zoomDirection},1.06)':x='${panX}':y='${panY}':d=${slideFrames}:s=${WIDTH}x${HEIGHT}:fps=${FPS},`,
        "setsar=1,format=yuv420p",
        `[v${index}]`,
      ].join("")
    );
  }

  let previous = "[v0]";
  for (let index = 1; index < imageCount; index += 1) {
    const output = index === imageCount - 1 ? "[outv]" : `[x${index}]`;
    const offset = IMAGE_DURATION * index - TRANSITION_DURATION * index;

    transitions.push(
      `${previous}[v${index}]xfade=transition=fade:duration=${TRANSITION_DURATION}:offset=${offset}${output}`
    );
    previous = output;
  }

  return [...slides, ...transitions].join(";");
}

function getDurationSeconds(imageCount) {
  return IMAGE_DURATION * imageCount - TRANSITION_DURATION * (imageCount - 1);
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

  const outputPath = path.join(OUTPUT_DIR, `car-${carId}.mp4`);
  const args = [];

  for (const image of images) {
    args.push("-loop", "1", "-t", String(IMAGE_DURATION), "-i", image);
  }

  args.push(
    "-filter_complex",
    buildFilter(images.length),
    "-map",
    "[outv]",
    "-t",
    String(getDurationSeconds(images.length)),
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

  const result = spawnSync(FFMPEG_BIN, args, {
    encoding: "utf8",
    stdio: "pipe",
    windowsHide: true,
  });

  if (result.status !== 0) {
    throw new Error(`ffmpeg failed:\n${result.stderr || result.stdout}`);
  }

  const stats = fs.statSync(outputPath);

  console.log("Car video created");
  console.log(`Output: ${outputPath}`);
  console.log("Photos:");
  for (const image of images) {
    console.log(`- ${image}`);
  }
  console.log(`Duration: ${getDurationSeconds(images.length)}s`);
  console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
