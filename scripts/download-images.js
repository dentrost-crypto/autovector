const fs = require("fs/promises");
const path = require("path");

const carsPath = path.join(process.cwd(), "app", "data", "cars.json");
const uploadsRoot = path.join(process.cwd(), "public", "uploads", "cars");
const legacyUploadsRoot = path.join(process.cwd(), "public", "uploads");
const fallbackImage = "/uploads/fallback.svg";
const MAX_LOCAL_IMAGES = 4;
const DOWNLOAD_BRAND = process.env.DOWNLOAD_BRAND || "";
const DOWNLOAD_ID_FROM = Number(process.env.DOWNLOAD_ID_FROM || 0);
const DOWNLOAD_ID_TO = Number(process.env.DOWNLOAD_ID_TO || 0);

const imageRequestHeaders = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Referer: "https://korex-auto.com/",
  Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*",
};

function isRemoteImageUrl(value) {
  return (
    typeof value === "string" &&
    /^https?:\/\//i.test(value.trim()) &&
    !value.includes("fallback.svg")
  );
}

function getRemoteImageSources(car) {
  const sources = [
    ...(Array.isArray(car.remoteImages) ? car.remoteImages : []),
    ...(Array.isArray(car.images) ? car.images : []),
    car.image,
    car.remoteImage,
  ].filter(isRemoteImageUrl);

  return Array.from(new Set(sources.map((source) => source.trim())));
}

function shouldProcessCar(car) {
  if (DOWNLOAD_BRAND && car.brand !== DOWNLOAD_BRAND) {
    return false;
  }

  if (DOWNLOAD_ID_FROM > 0 && Number(car.id) < DOWNLOAD_ID_FROM) {
    return false;
  }

  if (DOWNLOAD_ID_TO > 0 && Number(car.id) > DOWNLOAD_ID_TO) {
    return false;
  }

  return true;
}

async function getExistingLocalImages(car) {
  const localImages = [];
  const carDir = path.join(uploadsRoot, String(car.id));

  for (let index = 1; index <= MAX_LOCAL_IMAGES; index += 1) {
    const fileName = `${index}.webp`;
    const filePath = path.join(carDir, fileName);
    const publicPath = `/uploads/cars/${car.id}/${fileName}`;

    try {
      await fs.access(filePath);
      localImages.push(publicPath);
    } catch (error) {
      // This local image does not exist yet.
    }
  }

  return localImages;
}

async function downloadImage(url, filePath) {
  const response = await fetch(url, {
    headers: imageRequestHeaders,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.startsWith("image/")) {
    throw new Error(`Unexpected content type: ${contentType || "unknown"}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.length === 0) {
    throw new Error("Downloaded empty file");
  }

  await fs.writeFile(filePath, buffer);
}

async function updateCarImages(car) {
  const sources = getRemoteImageSources(car);
  const carDir = path.join(uploadsRoot, String(car.id));
  const localImages = await getExistingLocalImages(car);

  if (localImages.length > 0) {
    return {
      ...car,
      image: localImages[0],
      images: localImages,
      remoteImage: sources[0] || car.remoteImage || "",
      remoteImages: sources,
    };
  }

  await fs.mkdir(carDir, { recursive: true });

  for (const [index, source] of sources.slice(0, MAX_LOCAL_IMAGES).entries()) {
    const fileName = `${index + 1}.webp`;
    const filePath = path.join(carDir, fileName);
    const publicPath = `/uploads/cars/${car.id}/${fileName}`;

    try {
      await downloadImage(source, filePath);
      localImages.push(publicPath);
      console.log(`Downloaded car ${car.id} image ${index + 1}: ${source}`);
    } catch (error) {
      console.warn(
        [
          `Failed to download car ${car.id} image ${index + 1}`,
          `title: ${car.title || "unknown"}`,
          `url: ${source}`,
          `error: ${error.message}`,
        ].join("\n")
      );
    }
  }

  if (localImages.length === 0) {
    const legacyFilePath = path.join(legacyUploadsRoot, `car-${car.id}.webp`);
    const filePath = path.join(carDir, "1.webp");
    const publicPath = `/uploads/cars/${car.id}/1.webp`;

    try {
      await fs.copyFile(legacyFilePath, filePath);
      localImages.push(publicPath);
      console.log(`Reused legacy local image for car ${car.id}: ${legacyFilePath}`);
    } catch (error) {
      // No legacy local image exists for this car.
    }
  }

  if (localImages.length === 0) {
    return {
      ...car,
      image: fallbackImage,
      images: [],
      remoteImage: sources[0] || car.remoteImage || "",
      remoteImages: sources,
    };
  }

  return {
    ...car,
    image: localImages[0],
    images: localImages,
    remoteImage: sources[0] || car.remoteImage || "",
    remoteImages: sources,
  };
}

async function main() {
  await fs.mkdir(uploadsRoot, { recursive: true });

  const cars = JSON.parse(await fs.readFile(carsPath, "utf8"));
  const updatedCars = [];
  let processedCount = 0;

  for (const car of cars) {
    if (!shouldProcessCar(car)) {
      updatedCars.push(car);
      continue;
    }

    processedCount += 1;
    updatedCars.push(await updateCarImages(car));
  }

  await fs.writeFile(carsPath, `${JSON.stringify(updatedCars, null, 2)}\n`);

  const readyCount = updatedCars.filter((car) =>
    String(car.image).startsWith("/uploads/cars/")
  ).length;

  console.log(`Cars with local images: ${readyCount}/${updatedCars.length}`);
  console.log(`Processed cars: ${processedCount}/${updatedCars.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
