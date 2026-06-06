const fs = require("fs/promises");
const path = require("path");

const carsPath = path.join(process.cwd(), "app", "data", "cars.json");
const uploadsDir = path.join(process.cwd(), "public", "uploads");

function getExtension(url, contentType) {
  const pathname = new URL(url).pathname.toLowerCase();

  if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) {
    return "jpg";
  }

  if (pathname.endsWith(".png")) {
    return "png";
  }

  if (pathname.endsWith(".webp")) {
    return "webp";
  }

  if (contentType.includes("jpeg")) {
    return "jpg";
  }

  if (contentType.includes("png")) {
    return "png";
  }

  return "webp";
}

async function downloadImage(car) {
  const remoteImage = car.remoteImage || car.image;

  if (!remoteImage || remoteImage.startsWith("/uploads/")) {
    return car.image || "/uploads/fallback.svg";
  }

  try {
    const response = await fetch(remoteImage);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.startsWith("image/")) {
      throw new Error(`Unexpected content type: ${contentType || "unknown"}`);
    }

    const extension = getExtension(remoteImage, contentType);
    const fileName = `car-${car.id}.${extension}`;
    const filePath = path.join(uploadsDir, fileName);
    const buffer = Buffer.from(await response.arrayBuffer());

    await fs.writeFile(filePath, buffer);

    return `/uploads/${fileName}`;
  } catch (error) {
    console.warn(`Failed to download image for car ${car.id}: ${error.message}`);
    return "/uploads/fallback.svg";
  }
}

async function main() {
  await fs.mkdir(uploadsDir, { recursive: true });

  const cars = JSON.parse(await fs.readFile(carsPath, "utf8"));
  const updatedCars = [];

  for (const car of cars) {
    const image = await downloadImage(car);
    const remoteImage =
      car.remoteImage || (car.image && !car.image.startsWith("/uploads/") ? car.image : "");

    updatedCars.push({
      ...car,
      image,
      remoteImage,
    });
  }

  await fs.writeFile(carsPath, `${JSON.stringify(updatedCars, null, 2)}\n`);

  const downloadedCount = updatedCars.filter((car) => car.image).length;
  console.log(`Images ready: ${downloadedCount}/${updatedCars.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
