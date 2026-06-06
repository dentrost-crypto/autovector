"use client";

import cars from "../../data/cars.json";
import Link from "next/link";
import { useParams } from "next/navigation";

type Car = (typeof cars)[number] &
  Partial<{
    color: string;
    drive: string;
    fuel: string;
    priceRu: string;
    transmission: string;
  }>;

export default function CarPage() {
  const params = useParams();

  const carId = Number(params.id);

  const car = cars.find((c) => c.id === carId) as Car | undefined;

  if (!car) {
    return (
      <main className="min-h-screen bg-black text-white p-10">

        {/* HEADER */}
        <header className="flex items-center justify-between px-10 py-6 border-b border-white/10">

          <Link
            href="/"
            className="text-3xl font-bold hover:text-yellow-400 transition"
          >
            AUTO IMPORT
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
          <div className="relative w-full max-w-5xl mx-auto h-[280px] md:h-[520px] overflow-hidden rounded-3xl">
            <img
              src={car.image}
              alt={car.title}
              className="
                w-full
                h-full
                object-cover
              "
            />
          </div>

          {/* MAIN INFO */}
          <div className="mt-8 md:mt-10">

            <h1 className="text-4xl md:text-7xl font-bold mb-4 md:mb-6">
              {car.title}
            </h1>

            <p className="text-4xl md:text-5xl text-yellow-400 font-bold mb-2">
              ≈ {car.priceRu || formattedPrice}
            </p>

            <p className="text-lg text-gray-300 mb-1">
              Цена в Китае: {formattedPrice}
            </p>

            <p className="text-sm text-gray-500">
              *Стоимость ориентировочная
            </p>

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
    href="#"
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
  <a
    href="#"
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
      transition
      duration-300
      hover:bg-yellow-400
      hover:scale-[1.02]
    "
  >

    <img
      src="/max.png"
      alt="max"
      className="w-8 h-8"
    />

    Написать в MAX

  </a>

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
                {similarCar.title}
              </h3>

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
    </main>
  );
}
