"use client";
import { useState } from "react";
import cars from "./data/cars.json";
import rates from "./data/rates.json";

const BROKEN_IMAGE_MARKERS = ["fallback", "undefined", "null"];
const FALLBACK_IMAGE = "/uploads/fallback.svg";
const CNY_TO_RUB = 10.5;
const RUSSIA_DELIVERY_COST_RUB = 900000;

function isValidImageUrl(image: unknown) {
  if (typeof image !== "string") {
    return false;
  }

  const trimmed = image.trim();

  return (
    trimmed.length > 0 &&
    !BROKEN_IMAGE_MARKERS.some((marker) => trimmed.toLowerCase().includes(marker))
  );
}

function getCarImageUrls(car: (typeof cars)[number]) {
  const rawImages = Array.isArray(car.images) ? car.images : [];
  const images = [...rawImages, car.image].filter(isValidImageUrl) as string[];

  return Array.from(new Set(images));
}

function getPrimaryImage(car: (typeof cars)[number], failedImages: string[] = []) {
  return (
    getCarImageUrls(car).find((image) => !failedImages.includes(image)) ||
    FALLBACK_IMAGE
  );
}

function hasUsableImages(car: (typeof cars)[number], failedImages: string[] = []) {
  return getCarImageUrls(car).some((image) => !failedImages.includes(image));
}

function parsePriceNumber(price: unknown) {
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

function formatRubPrice(price: number) {
  return `${Math.round(price).toLocaleString("ru-RU")} \u20bd`;
}

function calculateRussiaPrice(priceCny: unknown) {
  return parsePriceNumber(priceCny) * CNY_TO_RUB + RUSSIA_DELIVERY_COST_RUB;
}

function getCarRubPrice(car: (typeof cars)[number]) {
  const rawPrice = (car as { price: number | string }).price;

  if (typeof rawPrice === "string" && rawPrice.includes("\u20bd")) {
    return parsePriceNumber(rawPrice);
  }

  return calculateRussiaPrice(rawPrice);
}

function getCarDisplayTitle(title: string) {
  return title.replace(/\s*,?\s*лот\s*№\s*\d+/i, "").trim();
}

function getCarModelTitle(title: string) {
  return getCarDisplayTitle(title)
    .replace(/\s+20\d{2}\s*(?:г\.?|Рі\.?)?$/i, "")
    .replace(/\bseries\b/i, "Series")
    .trim();
}

function getCarYearLabel(car: (typeof cars)[number]) {
  const year = String(car.year || car.title).match(/\b(20\d{2})\b/)?.[1] || "";

  return year ? `${year} \u0433.` : "";
}

function getCarLotNumber(title: string) {
  return title.match(/лот\s*№\s*(\d+)/i)?.[1] || "";
}

function getCarBrand(car: (typeof cars)[number]) {
  const value = (car as { brand?: string }).brand;

  return typeof value === "string" ? value.trim() : "";
}

function getCarModel(car: (typeof cars)[number]) {
  const value = (car as { model?: string }).model;

  return typeof value === "string" ? value.trim() : "";
}

function getCarYear(car: (typeof cars)[number]) {
  const year = Number((car as { year?: string | number }).year);

  return Number.isInteger(year) ? year : 0;
}

export default function Home() {
  const [selectedBrand, setSelectedBrand] = useState("");
  const [name, setName] = useState("");
const [budget, setBudget] = useState("");
const [carRequest, setCarRequest] = useState("");
const [phone, setPhone] = useState("");
const [telegram, setTelegram] = useState("");
const [comment, setComment] = useState("");
  const [selectedPrice, setSelectedPrice] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedYearRange, setSelectedYearRange] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const sendRequest = async () => {

  
const response = await fetch("/api/request", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
    body: JSON.stringify({
  name,
  budget,
  carRequest,
  phone,
  telegram,
  comment,
}),
  });

  const data = await response.json();

  if (data.success) {

    alert("Заявка отправлена 🚗");

    setName("");
    setBudget("");
    setCarRequest("");
    setPhone("");
    setTelegram("");
    setComment("");

  } else {

    alert("Ошибка отправки");

  }

};
  const brandOptions = Array.from(
    new Set(cars.map(getCarBrand).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, "ru"));
  const modelOptions = Array.from(
    new Set(
      cars
        .filter((car) => selectedBrand === "" || getCarBrand(car) === selectedBrand)
        .map(getCarModel)
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, "ru"));
  const currentYear = new Date().getFullYear();
  const yearRanges = [
    {
      label: `${currentYear}\u2013${currentYear - 1}`,
      min: currentYear - 1,
      max: currentYear,
    },
    {
      label: String(currentYear - 2),
      min: currentYear - 2,
      max: currentYear - 2,
    },
    {
      label: `${currentYear - 3}\u2013${currentYear - 5}`,
      min: currentYear - 5,
      max: currentYear - 3,
    },
    {
      label: `${currentYear - 6}\u2013${currentYear - 8}`,
      min: currentYear - 8,
      max: currentYear - 6,
    },
    {
      label: `${currentYear - 9}\u2013${currentYear - 11}`,
      min: currentYear - 11,
      max: currentYear - 9,
    },
  ];

  const filteredCars = cars
    .filter((car) => {
      const matchesBrand = selectedBrand === "" || getCarBrand(car) === selectedBrand;
      const matchesModel = selectedModel === "" || getCarModel(car) === selectedModel;
      const selectedRange = yearRanges.find((range) => range.label === selectedYearRange);
      const carYear = getCarYear(car);
      const matchesYear =
        !selectedRange ||
        (carYear >= selectedRange.min && carYear <= selectedRange.max);
      const matchesPrice =
        selectedPrice === "" ||
        (selectedPrice === "over-4000000"
          ? getCarRubPrice(car) > 4000000
          : getCarRubPrice(car) <= Number(selectedPrice));
      const matchesCountry =
        selectedCountry === "" || car.country === selectedCountry;

      return matchesBrand && matchesModel && matchesYear && matchesPrice && matchesCountry;
    })
    .sort(
      (a, b) =>
        Number(hasUsableImages(b, failedImages)) -
        Number(hasUsableImages(a, failedImages))
    );
  const handleCardImageError = (image: string) => {
    if (image === FALLBACK_IMAGE) {
      return;
    }

    setFailedImages((current) =>
      current.includes(image) ? current : [...current, image]
    );
  };

  return (
    <main className="min-h-screen bg-black text-white">
      
      {/* HEADER */}
<header
  className="
    flex
    items-center
    justify-between
    px-6
    md:px-10
    py-6
    border-b
    border-white/10
    sticky
    top-0
    z-50
    bg-black/80
    backdrop-blur-xl
  "
>

  <h1
    className="
      text-3xl
      font-black
      tracking-wide
      hover:text-yellow-400
      transition
      duration-300
      cursor-pointer
    "
  >
    AutoVector
  </h1>

  {/* DESKTOP MENU */}
  <nav className="hidden md:flex items-center gap-6 text-lg font-medium">

    <a
      href="#"
      className="hover:text-yellow-400 transition duration-300"
    >
      Авто из Китая
    </a>

    <a
      href="#"
      className="hover:text-yellow-400 transition duration-300"
    >
      Авто из Кореи
    </a>

    <a
      href="#"
      className="hover:text-yellow-400 transition duration-300"
    >
      Авто из Японии
    </a>

    <a
      href="#about"
      className="hover:text-yellow-400 transition duration-300"
    >
      {"\u041e \u043d\u0430\u0441"}
    </a>

    <div className="text-lg text-yellow-400 font-semibold">
      ¥ {rates.CNY}
    </div>


    <div className="text-sm text-gray-300">
      € {rates.EUR}
    </div>

    <div className="flex flex-col text-sm leading-tight text-white">
      <a href="tel:+79898029929" className="hover:text-yellow-400 transition">
        +7 989 802 9929
      </a>
      <a href="tel:+79086760707" className="hover:text-yellow-400 transition">
        +7 908 676 0707
      </a>
    </div>

    <a
      href="#request-form"
      className="
        bg-yellow-400
        text-black
        px-5
        py-2
        rounded-xl
        font-semibold
        hover:scale-105
        transition
        duration-300
      "
    >
      Подбор авто
    </a>

  </nav>

  {/* MOBILE BUTTON */}
  <button
    onClick={() => setMobileMenu(!mobileMenu)}
    className="md:hidden text-3xl text-white"
  >
    ☰
  </button>

</header>

{/* MOBILE MENU */}
{mobileMenu && (

  <div
    className="
      md:hidden
      fixed
      top-[90px]
      left-0
      w-full
      bg-black
      border-b
      border-white/10
      z-40
      p-6
      flex
      flex-col
      gap-6
      text-xl
    "
  >

    <a href="#" onClick={() => setMobileMenu(false)}>
      Авто из Китая
    </a>

    <a href="#" onClick={() => setMobileMenu(false)}>
      Авто из Кореи
    </a>

    <a href="#" onClick={() => setMobileMenu(false)}>
      Авто из Японии
    </a>
    <a href="#about" onClick={() => setMobileMenu(false)}>
      {"\u041e \u043d\u0430\u0441"}
    </a>


    <div className="text-sm text-gray-300">
      ¥ {rates.CNY}
    </div>

    <div className="text-sm text-gray-300">
      € {rates.EUR}
    </div>

    <div className="flex flex-col gap-2 text-base text-white">
      <a href="tel:+79898029929">
        +7 989 802 9929
      </a>
      <a href="tel:+79086760707">
        +7 908 676 0707
      </a>
    </div>

    <a
      href="#request-form"
      onClick={() => setMobileMenu(false)}
      className="
        bg-yellow-400
        text-black
        px-5
        py-3
        rounded-xl
        text-center
        font-semibold
      "
    >
      Подбор авто
    </a>

  </div>

)}

{/* HERO */}
<section
  className="
    relative
    min-h-[90vh]
    flex
    items-center
    px-6
    md:px-10
    overflow-hidden
  "
>

        {/* BACKGROUND */}
        <img
          src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2400&auto=format&fit=crop"
          alt=""
          className="
            absolute
            inset-0
            w-full
            h-full
            object-cover
            object-[62%_center]
            autovector-soft-zoom
          "
        />

        {/* DARK OVERLAY */}
        <div
          className="
            absolute
            inset-0
            bg-[linear-gradient(90deg,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.50)_38%,rgba(0,0,0,0.18)_100%)]
          "
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />

        {/* CONTENT */}
        <div className="relative z-10 max-w-5xl autovector-hero-reveal">

          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.28em] text-yellow-300/90 md:text-sm">
            AutoVector
          </p>

          <h2 className="max-w-4xl text-[2.8rem] font-semibold leading-[0.98] md:text-7xl md:leading-[0.96]">
            {"\u0410\u0432\u0442\u043e\u043c\u043e\u0431\u0438\u043b\u0438 \u0438\u0437 \u041a\u043e\u0440\u0435\u0438, \u041a\u0438\u0442\u0430\u044f \u0438 \u042f\u043f\u043e\u043d\u0438\u0438 \u0431\u0435\u0437 \u0440\u0438\u0441\u043a\u0430 \u0438 \u043f\u0435\u0440\u0435\u043f\u043b\u0430\u0442"}
          </h2>

          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/82 md:text-2xl md:leading-snug">
            {"\u041c\u044b \u043d\u0430\u0445\u043e\u0434\u0438\u043c, \u043f\u0440\u043e\u0432\u0435\u0440\u044f\u0435\u043c \u0438 \u0434\u043e\u0441\u0442\u0430\u0432\u043b\u044f\u0435\u043c \u0430\u0432\u0442\u043e\u043c\u043e\u0431\u0438\u043b\u0438 \u043f\u043e\u0434 \u043a\u043b\u044e\u0447 \u043f\u043e \u0432\u0441\u0435\u0439 \u0420\u043e\u0441\u0441\u0438\u0438."}
          </p>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <a
              href="#request-form"
              className="inline-flex items-center justify-center rounded-xl bg-yellow-400 px-7 py-4 text-base font-bold text-black shadow-2xl shadow-yellow-400/15 transition duration-300 hover:bg-yellow-300 hover:shadow-yellow-400/25 md:px-9"
            >
              {"\u041f\u043e\u0434\u043e\u0431\u0440\u0430\u0442\u044c \u0430\u0432\u0442\u043e\u043c\u043e\u0431\u0438\u043b\u044c"}
            </a>

            <a
              href="#catalog"
              className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/8 px-7 py-4 text-base font-semibold text-white backdrop-blur-md transition duration-300 hover:border-white/45 hover:bg-white/14 md:px-9"
            >
              {"\u041f\u043e\u0441\u043c\u043e\u0442\u0440\u0435\u0442\u044c \u043a\u0430\u0442\u0430\u043b\u043e\u0433"}
            </a>
          </div>

          <div className="mt-12 grid gap-3 text-sm font-medium text-white/78 sm:grid-cols-2 md:flex md:flex-wrap md:gap-6">
            <span>{"\u2713 \u041f\u0440\u043e\u0432\u0435\u0440\u043a\u0430 \u0438\u0441\u0442\u043e\u0440\u0438\u0438"}</span>
            <span>{"\u2713 \u0424\u043e\u0442\u043e \u0434\u043e \u043f\u043e\u043a\u0443\u043f\u043a\u0438"}</span>
            <span>{"\u2713 \u041f\u043e\u043b\u043d\u043e\u0435 \u0441\u043e\u043f\u0440\u043e\u0432\u043e\u0436\u0434\u0435\u043d\u0438\u0435"}</span>
            <span>{"\u2713 \u0414\u043e\u0441\u0442\u0430\u0432\u043a\u0430 \u043f\u043e \u0420\u0424"}</span>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section
        className="
          relative
          min-h-[85vh]
          overflow-hidden
          bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.10),transparent_32%),linear-gradient(135deg,#050505_0%,#111111_48%,#050505_100%)]
        "
      >
        <div className="grid min-h-[85vh] w-full items-stretch gap-12 pl-6 md:pl-10 lg:grid-cols-[0.33fr_0.67fr] lg:gap-16">
          <div className="flex max-w-xl flex-col justify-center py-20 autovector-hero-reveal md:py-28 lg:pl-0">
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-yellow-300/90 md:text-sm">
              {"\u0421\u041e\u041f\u0420\u041e\u0412\u041e\u0416\u0414\u0415\u041d\u0418\u0415 \u041f\u041e\u041a\u0423\u041f\u041a\u0418"}
            </p>

            <h3 className="max-w-xl text-4xl font-semibold leading-[1.08] text-white md:text-4xl xl:text-5xl xl:leading-[1.04]">
              {"\u041c\u044b \u0441\u043e\u043f\u0440\u043e\u0432\u043e\u0436\u0434\u0430\u0435\u043c \u043f\u043e\u043a\u0443\u043f\u043a\u0443"}
              <br />
              {"\u0430\u0432\u0442\u043e\u043c\u043e\u0431\u0438\u043b\u044f \u043f\u043e\u0434 \u043a\u043b\u044e\u0447"}
            </h3>

            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-white/70 md:text-xl">
              {"AutoVector \u043f\u043e\u043c\u043e\u0433\u0430\u0435\u0442 \u043f\u043e\u0434\u043e\u0431\u0440\u0430\u0442\u044c, \u043f\u0440\u043e\u0432\u0435\u0440\u0438\u0442\u044c, \u0432\u044b\u043a\u0443\u043f\u0438\u0442\u044c \u0438 \u0434\u043e\u0441\u0442\u0430\u0432\u0438\u0442\u044c \u0430\u0432\u0442\u043e\u043c\u043e\u0431\u0438\u043b\u044c \u0438\u0437 \u041a\u043e\u0440\u0435\u0438, \u041a\u0438\u0442\u0430\u044f \u0438\u043b\u0438 \u042f\u043f\u043e\u043d\u0438\u0438 \u0432 \u0432\u0430\u0448 \u0433\u043e\u0440\u043e\u0434."}
            </p>

            <div className="mt-12 grid grid-cols-2 gap-x-12 gap-y-10 border-y border-white/10 py-10 md:gap-x-16">
              {[
                ["200+", "\u043f\u043e\u0434\u043e\u0431\u0440\u0430\u043d\u043d\u044b\u0445 \u0430\u0432\u0442\u043e\u043c\u043e\u0431\u0438\u043b\u0435\u0439"],
                ["3 \u0441\u0442\u0440\u0430\u043d\u044b", "\u043f\u043e\u0438\u0441\u043a\u0430"],
                ["100%", "\u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0430 \u043f\u0435\u0440\u0435\u0434 \u043f\u043e\u043a\u0443\u043f\u043a\u043e\u0439"],
                ["24/7", "\u0441\u043e\u043f\u0440\u043e\u0432\u043e\u0436\u0434\u0435\u043d\u0438\u0435 \u043a\u043b\u0438\u0435\u043d\u0442\u0430"],
              ].map(([value, label]) => (
                <div key={value}>
                  <p className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
                    {value}
                  </p>
                  <p className="mt-4 max-w-36 text-sm leading-relaxed text-white/55">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-10 max-w-2xl text-lg leading-relaxed text-white/72">
              {"\u0412\u044b \u043d\u0435 \u043e\u0441\u0442\u0430\u0435\u0442\u0435\u0441\u044c \u043e\u0434\u0438\u043d \u043d\u0430 \u043e\u0434\u0438\u043d \u0441 \u0430\u0443\u043a\u0446\u0438\u043e\u043d\u043e\u043c, \u043f\u0440\u043e\u0434\u0430\u0432\u0446\u043e\u043c, \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u0430\u043c\u0438 \u0438 \u043b\u043e\u0433\u0438\u0441\u0442\u0438\u043a\u043e\u0439. \u041c\u044b \u0432\u0435\u0434\u0451\u043c \u043f\u0440\u043e\u0446\u0435\u0441\u0441 \u043e\u0442 \u043f\u0435\u0440\u0432\u043e\u0433\u043e \u043f\u043e\u0434\u0431\u043e\u0440\u0430 \u0434\u043e \u043f\u0435\u0440\u0435\u0434\u0430\u0447\u0438 \u043a\u043b\u044e\u0447\u0435\u0439."}
            </p>

            <a
              href="#request-form"
              className="mt-10 inline-flex items-center justify-center rounded-xl bg-yellow-400 px-8 py-4 text-base font-bold text-black shadow-2xl shadow-yellow-400/10 transition duration-300 hover:bg-yellow-300 hover:shadow-yellow-400/20"
            >
              {"\u041e\u0431\u0441\u0443\u0434\u0438\u0442\u044c \u043f\u043e\u0434\u0431\u043e\u0440"}
            </a>
          </div>

          <div className="relative min-h-[560px] w-full overflow-hidden bg-zinc-950 lg:min-h-[85vh] xl:min-h-[820px]">
            {/* Reserve trust image: https://www.chase.com/content/services/rendition/image.medium.jpg/unified-assets/photography/articles/education-center/auto/buying/seo-what-to-know-about-out-the-door-price-101025.jpg */}
            <img
              src="https://images-porsche.imgix.net/-/media/44C12A2B7BB94DF1A547ED331BDAEA47_8CC8227F3FBF4C76A7C1CEF1DEB76A71_017-text-media-content_4-3_1440x1080_defaultmobile_PS24DDBID0002_EU?auto=format&crop=focalpoint&q=70&w=2200"
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-[55%_center]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/5" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent" />
          </div>
        </div>
      </section>

      {/* CARS */}
      {/* CARS */}
<section id="catalog" className="px-10 py-20">

  <h3 className="text-4xl font-bold mb-10">
    Автомобили в наличии
  </h3>
{/* FILTER BAR */}
<div
  className="
    flex
    flex-wrap
    gap-4
    mb-10
  "
>

  <select
    value={selectedBrand}
    onChange={(e) => {
      setSelectedBrand(e.target.value);
      setSelectedModel("");
    }}
    className="
      bg-zinc-900
      border
      border-white/20
      hover:border-yellow-400/60
      focus:border-yellow-400
      focus:shadow-lg
      focus:shadow-yellow-400/15
      rounded-xl
      px-5
      py-4
      md:px-6
      text-white
      outline-none
      transition
    "
  >
    <option value="">Марка авто</option>
    {brandOptions.map((brand) => (
      <option key={brand} value={brand}>
        {brand}
      </option>
    ))}
  </select>

  <select
    value={selectedModel}
    onChange={(e) => setSelectedModel(e.target.value)}
    className="
      bg-zinc-900
      border
      border-white/20
      hover:border-yellow-400/60
      focus:border-yellow-400
      focus:shadow-lg
      focus:shadow-yellow-400/15
      rounded-xl
      px-5
      py-4
      md:px-6
      text-white
      outline-none
    "
  >
    <option value="">Модель</option>
    {modelOptions.map((model) => (
      <option key={model} value={model}>
        {model}
      </option>
    ))}
  </select>

  <select
    value={selectedYearRange}
    onChange={(e) => setSelectedYearRange(e.target.value)}
    className="
      bg-zinc-900
      border
      border-white/20
      hover:border-yellow-400/60
      focus:border-yellow-400
      focus:shadow-lg
      focus:shadow-yellow-400/15
      rounded-xl
      px-5
      py-4
      md:px-6
      text-white
      outline-none
    "
  >
    <option value="">Все года</option>
    {yearRanges.map((range) => (
      <option key={range.label} value={range.label}>
        {range.label}
      </option>
    ))}
  </select>
  
    <select
  value={selectedPrice}
  onChange={(e) => setSelectedPrice(e.target.value)}
  className="
    bg-zinc-900
    border
    border-white/20
    hover:border-yellow-400/60
    focus:border-yellow-400
    focus:shadow-lg
    focus:shadow-yellow-400/15
    rounded-xl
    px-5
    py-4
    md:px-6
    text-white
    outline-none
  "
>

  <option value="">Любая цена</option>
  <option value="1200000">до 1.2 млн ₽</option>
  <option value="1500000">до 1.5 млн ₽</option>
  <option value="2000000">до 2 млн ₽</option>
  <option value="2500000">до 2.5 млн ₽</option>
  <option value="3000000">до 3 млн ₽</option>
  <option value="3500000">до 3.5 млн ₽</option>
  <option value="4000000">до 4 млн ₽</option>
  <option value="over-4000000">свыше 4 млн ₽</option>

</select>
<select
  value={selectedCountry}
  onChange={(e) => setSelectedCountry(e.target.value)}
  className="
    bg-zinc-900
    border
    border-white/20
    hover:border-yellow-400/60
    focus:border-yellow-400
    rounded-xl
    px-5
    py-4
    md:px-6
    text-white
    outline-none
    transition
  "
>

  <option value="">Все страны</option>
  <option>Китай</option>
  <option>Корея</option>
  <option>Япония</option>

</select>


</div>
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">

    {filteredCars.map((car) => (

      <div
        key={car.id}
        className="
          group
          relative
          rounded-3xl
          overflow-hidden
          border
          border-white/10
hover:border-yellow-400/50
focus:border-yellow-400
focus:shadow-lg
focus:shadow-yellow-400/10
          bg-zinc-900
          transition
          duration-1000
          ease-in-out
          hover:scale-[1.01]
          hover:border-white/30
          hover:shadow-2xl
          hover:shadow-black/50
        "
      >

        {/* IMAGE */}
        <div className="relative overflow-hidden h-[420px] md:h-[460px]">

          <img
            src={getPrimaryImage(car, failedImages)}
            alt={car.title}
            onError={() => handleCardImageError(getPrimaryImage(car, failedImages))}
            className="
              w-full
              h-full
              object-cover
              transition
              duration-1000
              ease-in-out
            "
          />


          {/* OVERLAY */}
          <div
            className="
              absolute
              inset-0
              bg-gradient-to-t
              from-black
              via-black/70
              to-black/5
            "
          />

          {/* CONTENT */}
          <div
            className="
              absolute
              bottom-0
              left-0
              w-full
              p-6
              z-10
            "
          >

            <h4 className="mb-3 text-2xl font-bold leading-tight md:text-3xl">
              {getCarModelTitle(car.title)}
            </h4>

            <div className="mb-5 space-y-4">
              <div className="flex flex-wrap gap-2">
                {getCarYearLabel(car) && (
                  <span className="rounded-full border border-white/15 bg-black/45 px-3 py-1 text-sm font-semibold text-white backdrop-blur">
                    {getCarYearLabel(car)}
                  </span>
                )}
                <span className="rounded-full border border-white/15 bg-black/45 px-3 py-1 text-sm font-semibold text-white backdrop-blur">
                  {car.mileage}
                </span>
              </div>

              <div>
                <p className="text-3xl font-black text-yellow-400 md:text-4xl">
                  {"\u2248"} {formatRubPrice(calculateRussiaPrice(car.price))}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-gray-400">
                  {"\u043e\u0440\u0438\u0435\u043d\u0442\u0438\u0440 \u043f\u043e\u0434 \u043a\u043b\u044e\u0447 \u0432 \u0420\u0424"}
                </p>
              </div>
            </div>

            <a
  href={`/car/${car.id}`}
  className="
    block
    w-full
    text-center
    bg-white
    text-black
    py-3
    rounded-xl
    font-semibold
    transition
    duration-300
    hover:bg-yellow-400
    hover:scale-[1.02]
  "
>
  Подробнее
</a>

          </div>
        </div>

      </div>

    ))}

  </div>
</section>
{/* ABOUT */}
<section
  id="about"
  className="
    border-y
    border-white/10
    bg-zinc-950/95
    px-6
    py-16
    md:px-10
    md:py-24
  "
>
  <div className="mx-auto max-w-6xl">
    <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
      <div className="max-w-2xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-yellow-400/90">
          AutoVector
        </p>

        <h2 className="mb-6 text-4xl font-black leading-tight md:text-5xl">
          {"\u041e \u043d\u0430\u0441"}
        </h2>

        <div className="space-y-5 text-base leading-8 text-gray-300 md:text-lg">
          <p>
            {"AutoVector \u2014 \u0441\u0435\u0440\u0432\u0438\u0441 \u043f\u043e\u0434\u0431\u043e\u0440\u0430 \u0438 \u043f\u043e\u0441\u0442\u0430\u0432\u043a\u0438 \u0430\u0432\u0442\u043e\u043c\u043e\u0431\u0438\u043b\u0435\u0439 \u0438\u0437 \u041a\u0438\u0442\u0430\u044f, \u041a\u043e\u0440\u0435\u0438 \u0438 \u042f\u043f\u043e\u043d\u0438\u0438."}
          </p>

          <div>
            <p>
              {"\u041c\u044b \u043f\u043e\u043c\u043e\u0433\u0430\u0435\u043c \u043f\u043e\u0434\u043e\u0431\u0440\u0430\u0442\u044c \u0430\u0432\u0442\u043e\u043c\u043e\u0431\u0438\u043b\u044c \u043d\u0430\u043f\u0440\u044f\u043c\u0443\u044e \u0441 \u0437\u0430\u0440\u0443\u0431\u0435\u0436\u043d\u044b\u0445 \u043f\u043b\u043e\u0449\u0430\u0434\u043e\u043a:"}
            </p>
            <ul className="mt-3 space-y-2 text-white/85">
              <li>{"\u2014 \u0431\u0435\u0437 \u0441\u043a\u0440\u044b\u0442\u044b\u0445 \u0441\u0445\u0435\u043c,"}</li>
              <li>{"\u2014 \u0431\u0435\u0437 \u0441\u043b\u0443\u0447\u0430\u0439\u043d\u044b\u0445 \u043f\u043e\u0441\u0440\u0435\u0434\u043d\u0438\u043a\u043e\u0432,"}</li>
              <li>{"\u2014 \u0441 \u043f\u0440\u043e\u0437\u0440\u0430\u0447\u043d\u043e\u0439 \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u043e\u0439 \u0438 \u0441\u043e\u043f\u0440\u043e\u0432\u043e\u0436\u0434\u0435\u043d\u0438\u0435\u043c \u0441\u0434\u0435\u043b\u043a\u0438."}</li>
            </ul>
          </div>

          <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-white shadow-2xl shadow-black/20 backdrop-blur">
            {"\ud83d\udccd \u041d\u0430\u0448\u0438 \u043e\u0444\u0438\u0441\u044b \u0438 \u043f\u0430\u0440\u0442\u043d\u0451\u0440\u044b \u0440\u0430\u0431\u043e\u0442\u0430\u044e\u0442 \u0432:"}
            <br />
            {"\u041a\u0440\u0430\u0441\u043d\u043e\u0434\u0430\u0440\u0435, \u041c\u043e\u0441\u043a\u0432\u0435, \u0423\u043b\u0430\u043d-\u0423\u0434\u044d \u0438 \u0427\u0438\u0442\u0435."}
          </p>
        </div>
      </div>

      <div>
        <h3 className="mb-6 text-3xl font-bold md:text-4xl">
          {"\u041a\u0430\u043a \u043f\u0440\u043e\u0445\u043e\u0434\u0438\u0442 \u0441\u0434\u0435\u043b\u043a\u0430"}
        </h3>

        <div className="space-y-3">
          {[
            "\u0412\u044b \u0432\u044b\u0431\u0438\u0440\u0430\u0435\u0442\u0435 \u0430\u0432\u0442\u043e\u043c\u043e\u0431\u0438\u043b\u044c \u0438\u0437 \u043a\u0430\u0442\u0430\u043b\u043e\u0433\u0430 \u0438\u043b\u0438 \u043e\u0441\u0442\u0430\u0432\u043b\u044f\u0435\u0442\u0435 \u0437\u0430\u044f\u0432\u043a\u0443 \u043d\u0430 \u043f\u043e\u0434\u0431\u043e\u0440.",
            "\u0417\u0430\u043a\u043b\u044e\u0447\u0430\u0435\u043c \u0434\u043e\u0433\u043e\u0432\u043e\u0440 \u0438 \u0444\u0438\u043a\u0441\u0438\u0440\u0443\u0435\u043c \u043f\u0430\u0440\u0430\u043c\u0435\u0442\u0440\u044b \u0430\u0432\u0442\u043e\u043c\u043e\u0431\u0438\u043b\u044f \u0438 \u0441\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c.",
            "\u0412\u044b \u0432\u043d\u043e\u0441\u0438\u0442\u0435 \u043f\u0435\u0440\u0432\u044b\u0439 \u0430\u0432\u0430\u043d\u0441 \u2014 \u043f\u043e\u0441\u043b\u0435 \u044d\u0442\u043e\u0433\u043e \u043c\u044b \u0431\u0440\u043e\u043d\u0438\u0440\u0443\u0435\u043c \u0438 \u0432\u044b\u043a\u0443\u043f\u0430\u0435\u043c \u0430\u0432\u0442\u043e\u043c\u043e\u0431\u0438\u043b\u044c.",
            "\u0410\u0432\u0442\u043e\u043c\u043e\u0431\u0438\u043b\u044c \u043f\u0440\u043e\u0445\u043e\u0434\u0438\u0442 \u043e\u0444\u043e\u0440\u043c\u043b\u0435\u043d\u0438\u0435, \u043f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0443 \u043a \u043e\u0442\u043f\u0440\u0430\u0432\u043a\u0435, \u0434\u043e\u0441\u0442\u0430\u0432\u043a\u0443 \u0438 \u0442\u0430\u043c\u043e\u0436\u0435\u043d\u043d\u043e\u0435 \u043e\u0444\u043e\u0440\u043c\u043b\u0435\u043d\u0438\u0435 \u0432 \u0420\u0424.",
            "\u041f\u043e\u0441\u043b\u0435 \u043f\u0440\u0438\u0431\u044b\u0442\u0438\u044f \u0430\u0432\u0442\u043e\u043c\u043e\u0431\u0438\u043b\u044f \u0432\u044b \u043e\u043f\u043b\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0435 \u043e\u0441\u0442\u0430\u0432\u0448\u0443\u044e\u0441\u044f \u0447\u0430\u0441\u0442\u044c \u0441\u0443\u043c\u043c\u044b.",
            "\u0412\u044b \u043f\u043e\u043b\u0443\u0447\u0430\u0435\u0442\u0435 \u0430\u0432\u0442\u043e\u043c\u043e\u0431\u0438\u043b\u044c \u0432 \u0441\u043e\u0433\u043b\u0430\u0441\u043e\u0432\u0430\u043d\u043d\u043e\u043c \u043c\u0435\u0441\u0442\u0435 \u0432\u044b\u0434\u0430\u0447\u0438.",
          ].map((step, index) => (
            <div
              key={step}
              className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4 backdrop-blur transition hover:border-yellow-400/40 md:p-5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-sm font-black text-black shadow-lg shadow-yellow-400/20">
                {index + 1}
              </span>
              <p className="text-sm leading-7 text-gray-300 md:text-base">
                {step}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="mt-12 grid gap-8 border-t border-white/10 pt-10 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <h3 className="mb-5 text-3xl font-bold">
          {"\u0427\u0442\u043e \u0434\u043b\u044f \u043d\u0430\u0441 \u0432\u0430\u0436\u043d\u043e"}
        </h3>
        <ul className="grid gap-3 text-base text-gray-300 md:grid-cols-2">
          {[
            "\u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0430 \u0430\u0432\u0442\u043e\u043c\u043e\u0431\u0438\u043b\u044f \u043f\u0435\u0440\u0435\u0434 \u043f\u043e\u043a\u0443\u043f\u043a\u043e\u0439;",
            "\u0440\u0435\u0430\u043b\u044c\u043d\u044b\u0435 \u0444\u043e\u0442\u043e \u0438 \u0438\u043d\u0444\u043e\u0440\u043c\u0430\u0446\u0438\u044f \u043f\u043e \u0430\u0432\u0442\u043e\u043c\u043e\u0431\u0438\u043b\u044e;",
            "\u043f\u0440\u043e\u0437\u0440\u0430\u0447\u043d\u044b\u0439 \u0440\u0430\u0441\u0447\u0451\u0442 \u0441\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u0438;",
            "\u0441\u043e\u043f\u0440\u043e\u0432\u043e\u0436\u0434\u0435\u043d\u0438\u0435 \u0441\u0434\u0435\u043b\u043a\u0438 \u043d\u0430 \u0432\u0441\u0435\u0445 \u044d\u0442\u0430\u043f\u0430\u0445;",
            "\u043f\u043e\u0441\u0442\u043e\u044f\u043d\u043d\u0430\u044f \u0441\u0432\u044f\u0437\u044c \u0441 \u043a\u043b\u0438\u0435\u043d\u0442\u043e\u043c.",
          ].map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-yellow-400" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-3xl border border-yellow-400/25 bg-yellow-400/10 p-6 text-lg leading-8 text-white md:p-8">
        <p>
          {"AutoVector \u2014 \u044d\u0442\u043e \u043d\u0435 \u043f\u043e\u0442\u043e\u043a\u043e\u0432\u0430\u044f \u043f\u043b\u043e\u0449\u0430\u0434\u043a\u0430."}
        </p>
        <p className="mt-3 text-white/85">
          {"\u041c\u044b \u0434\u0435\u043b\u0430\u0435\u043c \u0443\u043f\u043e\u0440 \u043d\u0430 \u0438\u043d\u0434\u0438\u0432\u0438\u0434\u0443\u0430\u043b\u044c\u043d\u044b\u0439 \u043f\u043e\u0434\u0445\u043e\u0434, \u043f\u043e\u043d\u044f\u0442\u043d\u044b\u0439 \u043f\u0440\u043e\u0446\u0435\u0441\u0441 \u0438 \u0434\u043e\u043b\u0433\u043e\u0441\u0440\u043e\u0447\u043d\u043e\u0435 \u0434\u043e\u0432\u0435\u0440\u0438\u0435."}
        </p>
      </div>
    </div>
  </div>
</section>
{/* REQUEST FORM */}



<section id="request-form"></section>
  <div className="
    max-w-4xl
    mx-auto
    bg-zinc-900
    border
    border-white/10
    rounded-3xl
    p-8
    md:p-12
  ">

    <h2 className="text-4xl font-bold mb-4">
      Подбор автомобиля под ваш бюджет
    </h2>

    <p className="text-gray-400 text-lg mb-10">
      Не нашли подходящий автомобиль?
      Оставьте заявку и мы подберём варианты
      под ваш бюджет и задачи.
    </p>

    <div className="grid md:grid-cols-2 gap-6">

      <input
        type="text"
        placeholder="Ваше имя"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="
          bg-black
          border
          border-white/10
          rounded-2xl
          px-5
          py-4
          text-white
          outline-none
          focus:border-yellow-400
        "
      />

      <input
        type="text"
        placeholder="Телефон"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="
          bg-black
          border
          border-white/10
          rounded-2xl
          px-5
          py-4
          text-white
          outline-none
          focus:border-yellow-400
        "
      />
      <input
  type="text"
  placeholder="Telegram"
  value={telegram}
  onChange={(e) => setTelegram(e.target.value)}
  className="
    bg-black
    border
    border-white/10
    rounded-2xl
    px-5
    py-4
    text-white
    outline-none
    focus:border-yellow-400
  "
/>
      <input
        type="text"
        placeholder="Бюджет в РФ"
        value={budget}
        onChange={(e) => setBudget(e.target.value)}
        className="
          bg-black
          border
          border-white/10
          rounded-2xl
          px-5
          py-4
          text-white
          outline-none
          focus:border-yellow-400
        "
      />

      <select
        className="
          bg-black
          border
          border-white/10
          rounded-2xl
          px-5
          py-4
          text-white
          outline-none
          focus:border-yellow-400
        "
      >
        <option>Страна</option>
        <option>Китай</option>
        <option>Корея</option>
        <option>Япония</option>
      </select>

    </div>

    <textarea
      placeholder="Какое авто ищете? Марка, модель, пожелания..."
      value={carRequest}
      onChange={(e) => setCarRequest(e.target.value)}
      
      className="
        mt-6
        w-full
        h-40
        bg-black
        border
        border-white/10
        rounded-2xl
        px-5
        py-4
        text-white
        outline-none
        focus:border-yellow-400
      "
    />

    <button
    onClick={sendRequest}
      className="
        mt-8
        w-full
        bg-yellow-400
        text-black
        py-5
        rounded-2xl
        font-bold
        text-lg
        hover:scale-[1.01]
        transition
        duration-300
      "
    >
      Отправить заявку
    </button>

  </div>

      <footer className="mt-20 border-t border-white/10 bg-black px-6 py-12 md:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-6 text-3xl font-bold">
            Наши контакты
          </h2>

          <div className="grid gap-4 text-lg text-gray-300 md:grid-cols-2">
            <div className="flex gap-3">
              <span>📞</span>
              <div>
                <div>Телефон:</div>
                <a href="tel:+79898029929" className="block text-white transition hover:text-yellow-400">
                  +7 989 802 9929
                </a>
                <a href="tel:+79086760707" className="block text-white transition hover:text-yellow-400">
                  +7 908 676 0707
                </a>
              </div>
            </div>

            <a
              href="https://t.me/DenTrosPro"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white transition hover:text-yellow-400"
            >
              ✈ Telegram: @DenTrosPro
            </a>

            <div className="flex gap-3">
              <span>📍</span>
              <div>
                <div>{"\u041a\u0440\u0430\u0441\u043d\u043e\u0434\u0430\u0440"}</div>
                <div className="text-white/80">
                  {"\u0443\u043b. \u041c\u0443\u0440\u0430\u0442\u0430 \u0410\u0445\u0435\u0434\u0436\u0430\u043a\u0430 10 \u0410"}
                </div>
              </div>
            </div>
            <div>🚗 AutoVector</div>
            <div>⏰ Работаем ежедневно</div>
          </div>
        </div>
      </footer>

    </main>
  );
}
