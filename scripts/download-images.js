const fs = require("fs/promises");
const path = require("path");

const carsPath = path.join(process.cwd(), "app", "data", "cars.json");
const uploadsDir = path.join(process.cwd(), "public", "uploads");

const imageRequestHeaders = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Referer: "https://korex-auto.com/",
  Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*",
};

async function downloadImage(car) {
  const remoteImage =
    car.remoteImage ||
    (car.image && !car.image.startsWith("/uploads/") ? car.image : "");

  if (!remoteImage) {
    console.warn(`Skip car ${car.id}: no remote image URL`);
    return {
      image: car.image || "",
      remoteImage: "",
      downloaded: false,
    };
  }

  try {
    const response = await fetch(remoteImage, {
      headers: imageRequestHeaders,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.startsWith("image/")) {
      throw new Error(`Unexpected content type: ${contentType || "unknown"}`);
    }

    const fileName = `car-${car.id}.webp`;
    const filePath = path.join(uploadsDir, fileName);
    const buffer = Buffer.from(await response.arrayBuffer());

    await fs.writeFile(filePath, buffer);

    return {
      image: `/uploads/${fileName}`,
      remoteImage,
      downloaded: true,
    };
  } catch (error) {
    console.warn(
      [
        `Failed to download image for car ${car.id}`,
        `title: ${car.title || "unknown"}`,
        `url: ${remoteImage}`,
        `error: ${error.stack || error.message}`,
      ].join("\n")
    );

    return {
      image: car.image || "",
      remoteImage,
      downloaded: false,
    };
  }
}

async function main() {
  await fs.mkdir(uploadsDir, { recursive: true });

  const cars = JSON.parse(await fs.readFile(carsPath, "utf8"));
  const updatedCars = [];
  let downloadedCount = 0;

  for (const car of cars) {
    const result = await downloadImage(car);

    if (result.downloaded) {
      downloadedCount += 1;
    }

    updatedCars.push({
      ...car,
      image: result.image,
      remoteImage: result.remoteImage,
    });
  }

  await fs.writeFile(carsPath, `${JSON.stringify(updatedCars, null, 2)}\n`);

  const localImageCount = updatedCars.filter((car) =>
    String(car.image).startsWith("/uploads/car-")
  ).length;

  console.log(`Downloaded this run: ${downloadedCount}/${updatedCars.length}`);
  console.log(`Local car images ready: ${localImageCount}/${updatedCars.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
