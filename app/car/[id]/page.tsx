"use client";

import cars from "../../data/cars.json";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

const TELEGRAM_URL = "https://t.me/DenTrosPro";
const RESERVATION_DURATION_MS = 24 * 60 * 60 * 1000;
const FALLBACK_IMAGE = "/uploads/fallback.svg";

type Car = (typeof cars)[number] &
  Partial<{
    color: string;
    drive: string;
    fuel: string;
    images: string[];
    priceRu: string;
    transmission: string;
  }>;

function getCarDisplayTitle(title: string) {
  return title.replace(/\s*,?\s*лот\s*№\s*\d+/i, "").trim();
}

function getCarLotNumber(title: string) {
  return title.match(/лот\s*№\s*(\d+)/i)?.[1] || "";
}

export default function CarPage() {
  const params = useParams();

  const carId = Number(params.id);

  const car = cars.find((c) => c.id === carId) as Car | undefined;
  const reservationStorageKey = `autovector-reservation-${carId}`;
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [isReserved, setIsReserved] = useState(false);
  const [reservationStatus, setReservationStatus] = useState("");
  const [reservationError, setReservationError] = useState("");
  const [isSubmittingReservation, setIsSubmittingReservation] = useState(false);
  const [currentCarUrl, setCurrentCarUrl] = useState(
    `https://autovector.pro/car/${carId}`
  );
  const [reservationForm, setReservationForm] = useState({
    name: "",
    phone: "",
    contact: "",
    comment: "",
  });

  useEffect(() => {
    const expiresAt = Number(localStorage.getItem(reservationStorageKey));

    if (expiresAt > Date.now()) {
      setIsReserved(true);
      const timeout = window.setTimeout(() => {
        localStorage.removeItem(reservationStorageKey);
        setIsReserved(false);
      }, expiresAt - Date.now());

      return () => window.clearTimeout(timeout);
    }

    localStorage.removeItem(reservationStorageKey);
    setIsReserved(false);
  }, [reservationStorageKey]);

  useEffect(() => {
    setCurrentCarUrl(window.location.href || `https://autovector.pro/car/${carId}`);
  }, [carId]);

  if (!car) {
    return (
      <main className="min-h-screen bg-black text-white p-10">

        {/* HEADER */}
        <header className="flex items-center justify-between px-10 py-6 border-b border-white/10">

          <Link
            href="/"
            className="text-3xl font-bold hover:text-yellow-400 transition"
          >
            AutoVector
          </Link>

          <nav className="flex gap-8 text-lg">
            <a href="#">Авто из Китая</a>
            <a href="#">Авто из Кореи</a>
            <a href="#">Авто из Японии</a>
          </nav>

        </header>

        <h1 className="text-5xl font-bold mt-10">
          Автомобиль не найден
        </h1>

      </main>
    );
  }

  const formattedPrice = `¥ ${car.price.toLocaleString()}`;
  const displayTitle = getCarDisplayTitle(car.title);
  const lotNumber = getCarLotNumber(car.title);
  const mainImage = car.image || FALLBACK_IMAGE;
  const telegramText = encodeURIComponent(
    [
      "🔥 Заявка с сайта AutoVector",
      "Здравствуйте! Интересует авто:",
      displayTitle,
      lotNumber ? `Лот: ${lotNumber}` : "",
      `Ссылка: ${currentCarUrl}`,
    ]
      .filter(Boolean)
      .join("\n")
  );
  const telegramContactUrl = `${TELEGRAM_URL}?text=${telegramText}`;

  const handleReservationSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReservationError("");
    setReservationStatus("");
    setIsSubmittingReservation(true);

    const response = await fetch("/api/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "reservation",
        carTitle: displayTitle,
        carId: String(car.id),
        carUrl: currentCarUrl,
        lotNumber,
        name: reservationForm.name,
        phone: reservationForm.phone,
        contact: reservationForm.contact,
        comment: reservationForm.comment,
      }),
    });

    const data = await response.json();

    setIsSubmittingReservation(false);

    if (!data.success) {
      setReservationError("Не удалось отправить бронь. Попробуйте позже или напишите менеджеру.");
      return;
    }

    localStorage.setItem(
      reservationStorageKey,
      String(Date.now() + RESERVATION_DURATION_MS)
    );
    setIsReserved(true);
    setReservationStatus("Авто предварительно забронировано на 24 часа. Менеджер свяжется с вами.");
    setReservationForm({
      name: "",
      phone: "",
      contact: "",
      comment: "",
    });
  };

  return (
    <main className="min-h-screen bg-black text-white">

      {/* BACK BUTTON */}
      <div className="absolute top-10 left-10 z-30">

        <Link
          href="/"
          className="
            inline-flex
            items-center
            gap-3
            bg-black/50
            backdrop-blur-md
            border
            border-white/10
            px-6
            py-3
            rounded-2xl
            text-lg
            hover:bg-yellow-400
            hover:text-black
            transition
            duration-300
          "
        >
          ← Назад к автомобилям
        </Link>

      </div>

      {/* HERO */}
      <section className="pt-28 pb-10">
        <div className="max-w-6xl mx-auto px-6">

          {/* MAIN IMAGE */}
          <div className="relative w-full max-w-5xl mx-auto h-[320px] md:h-[560px] overflow-hidden rounded-3xl bg-zinc-950 border border-white/10">
            <img
              src={mainImage}
              alt={displayTitle}
              onError={(event) => {
                event.currentTarget.src = FALLBACK_IMAGE;
              }}
              className="
                w-full
                h-full
                object-contain
              "
            />
          </div>

          <p className="mx-auto mt-4 max-w-5xl text-sm leading-relaxed text-gray-400">
            Фотографии взяты из исходной карточки автомобиля. Перед покупкой мы дополнительно проверяем актуальность предложения и состояние машины.
          </p>

          {/* MAIN INFO */}
          <div className="mt-8 md:mt-10">

            <h1 className="text-4xl md:text-7xl font-bold mb-4 md:mb-6">
              {displayTitle}
            </h1>

            {lotNumber && (
              <p className="text-sm md:text-base text-gray-400 mb-4">
                Лот: {lotNumber}
              </p>
            )}

            <p className="text-4xl md:text-5xl text-yellow-400 font-bold mb-2">
              ≈ {car.priceRu || formattedPrice}
            </p>

            <p className="text-lg text-gray-300 mb-1">
              Цена в Китае: {formattedPrice}
            </p>

            <p className="text-sm text-gray-500">
              *Стоимость ориентировочная
            </p>

            {isReserved && (
              <div className="mt-6 inline-flex rounded-full bg-red-600 px-5 py-2 text-sm font-bold text-white">
                Забронировано на 24 часа
              </div>
            )}

          </div>

        </div>

      </section>

      {/* INFO */}
      <section className="py-10 pb-20">

        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-10">

          {/* CHARACTERISTICS */}
          <div className="bg-zinc-900 rounded-3xl p-8">

            <h2 className="text-3xl font-bold mb-8">
              Характеристики
            </h2>

            <div className="space-y-6 text-2xl text-gray-300">

              <div className="flex justify-between">
                <span>Год</span>
                <span>{car.year}</span>
              </div>

              <div className="flex justify-between">
                <span>Пробег</span>
                <span>{car.mileage}</span>
              </div>

              <div className="flex justify-between">
                <span>Объём</span>
                <span>{car.engine}</span>
              </div>

              <div className="flex justify-between">
                <span>Мощность</span>
                <span>{car.power}</span>
              </div>

              <div className="flex justify-between">
                <span>Топливо</span>
                <span>{car.fuel || car.engine}</span>
              </div>

              <div className="flex justify-between">
                <span>Трансмиссия</span>
                <span>{car.transmission || "уточняется"}</span>
              </div>

              <div className="flex justify-between">
                <span>Привод</span>
                <span>{car.drive || "уточняется"}</span>
              </div>

              <div className="flex justify-between">
                <span>Цвет</span>
                <span>{car.color || "уточняется"}</span>
              </div>

            </div>

          </div>

          {/* CONTACT */}
          <div className="bg-zinc-900 rounded-3xl p-8">

            <h2 className="text-3xl font-bold mb-8">
              Связаться
            </h2>

            <div className="space-y-4">

  {/* TELEGRAM */}
  <a
    href={telegramContactUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="
      flex
      items-center
      justify-center
      gap-4
      w-full
      bg-[#229ED9]
      text-white
      py-4
      rounded-2xl
      font-bold
      text-lg
      transition
      duration-300
      hover:scale-[1.02]
    "
  >

    <img
      src="/telegram.png"
      alt="telegram"
      className="w-8 h-8"
    />

    Написать в Telegram

  </a>

  {/* MAX */}
  <div className="group relative">
    <button
      type="button"
      disabled
      className="
        flex
        items-center
        justify-center
        gap-4
        w-full
        bg-white
        text-black
        py-4
        rounded-2xl
        font-bold
        text-lg
        opacity-70
        cursor-not-allowed
        transition
        duration-300
      "
    >

      <img
        src="/max.png"
        alt="max"
        className="w-8 h-8"
      />

      Скоро в MAX

    </button>

    <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-3 -translate-x-1/2 whitespace-nowrap rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white opacity-0 shadow-xl transition group-hover:opacity-100">
      Интеграция MAX готовится
    </div>
  </div>

  <button
    type="button"
    onClick={() => {
      setReservationStatus("");
      setReservationError("");
      setIsReservationOpen(true);
    }}
    className="
      w-full
      bg-yellow-400
      text-black
      py-4
      rounded-2xl
      font-bold
      text-lg
      transition
      duration-300
      hover:scale-[1.02]
      hover:bg-yellow-300
    "
  >
    Забронировать авто на 24 часа
  </button>

  {isReserved && (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-200">
      Забронировано на 24 часа
    </div>
  )}

</div>

          </div>

        </div>

      </section>
{/* SIMILAR CARS */}
<section className="px-10 pb-20">

  <h2 className="text-4xl font-bold mb-10">
    Похожие автомобили
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">

    {cars
      .filter((c) => c.id !== car.id)
      .slice(0, 3)
      .map((similarCar) => (

        <div
          key={similarCar.id}
          className="
            group
            relative
            rounded-3xl
            overflow-hidden
            border
            border-white/10
            bg-zinc-900
            transition
            duration-500
            hover:scale-[1.02]
            hover:border-white/30
            hover:shadow-2xl
            hover:shadow-black/50
          "
        >

          {/* IMAGE */}
          <div className="relative overflow-hidden h-[320px]">

            <img
              src={similarCar.image}
              alt={similarCar.title}
              className="
                w-full
                h-full
                object-cover
                transition
                duration-700
                group-hover:scale-110
              "
            />

            {/* OVERLAY */}
            <div
              className="
                absolute
                inset-0
                bg-gradient-to-t
                from-black
                via-black/20
                to-transparent
              "
            />

            {/* CONTENT */}
            <div className="absolute bottom-0 left-0 w-full p-6 z-10">

              <h3 className="text-3xl font-bold mb-3">
                {getCarDisplayTitle(similarCar.title)}
              </h3>

              {getCarLotNumber(similarCar.title) && (
                <p className="text-sm text-gray-400 mb-3">
                  Лот: {getCarLotNumber(similarCar.title)}
                </p>
              )}

              <p className="text-3xl text-yellow-400 font-bold mb-4">
                {similarCar.price}
              </p>

              <div className="space-y-2 text-gray-300 text-lg mb-6">
                <p>Пробег: {similarCar.mileage}</p>
                <p>Объём: {similarCar.engine}</p>
              </div>

              <a
                href={`/car/${similarCar.id}`}
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

      {isReservationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-zinc-900 p-6 md:p-8 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-6">
              <div>
                <h2 className="text-3xl font-bold">
                  Забронировать авто на 24 часа
                </h2>
                <p className="mt-2 text-sm text-gray-400">
                  {displayTitle}
                  {lotNumber ? ` • Лот: ${lotNumber}` : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsReservationOpen(false)}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-gray-300 transition hover:border-yellow-400 hover:text-yellow-400"
              >
                Закрыть
              </button>
            </div>

            {reservationStatus ? (
              <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-5 text-yellow-200">
                {reservationStatus}
              </div>
            ) : (
              <form onSubmit={handleReservationSubmit} className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-gray-300">
                  <div>Авто: {displayTitle}</div>
                  <div>ID авто: {car.id}</div>
                  {lotNumber && <div>Лот: {lotNumber}</div>}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    type="text"
                    required
                    placeholder="Имя"
                    value={reservationForm.name}
                    onChange={(event) =>
                      setReservationForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className="rounded-2xl border border-white/10 bg-black px-5 py-4 text-white outline-none transition focus:border-yellow-400"
                  />

                  <input
                    type="tel"
                    required
                    placeholder="Телефон"
                    value={reservationForm.phone}
                    onChange={(event) =>
                      setReservationForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    className="rounded-2xl border border-white/10 bg-black px-5 py-4 text-white outline-none transition focus:border-yellow-400"
                  />
                </div>

                <input
                  type="text"
                  required
                  placeholder="Telegram или MAX"
                  value={reservationForm.contact}
                  onChange={(event) =>
                    setReservationForm((current) => ({
                      ...current,
                      contact: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black px-5 py-4 text-white outline-none transition focus:border-yellow-400"
                />

                <textarea
                  placeholder="Комментарий"
                  value={reservationForm.comment}
                  onChange={(event) =>
                    setReservationForm((current) => ({
                      ...current,
                      comment: event.target.value,
                    }))
                  }
                  className="h-32 w-full rounded-2xl border border-white/10 bg-black px-5 py-4 text-white outline-none transition focus:border-yellow-400"
                />

                {reservationError && (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
                    {reservationError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingReservation}
                  className="w-full rounded-2xl bg-yellow-400 py-5 text-lg font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmittingReservation ? "Отправляем..." : "Отправить бронь"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </main>
  );
}
