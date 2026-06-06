"use client";
import { useState } from "react";
import cars from "./data/cars.json";
import { settings } from "./data/settings";

function getCarDisplayTitle(title: string) {
  return title.replace(/\s*,?\s*лот\s*№\s*\d+/i, "").trim();
}

function getCarLotNumber(title: string) {
  return title.match(/лот\s*№\s*(\d+)/i)?.[1] || "";
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
const [budget, setBudget] = useState("");
const [carRequest, setCarRequest] = useState("");
const [phone, setPhone] = useState("");
const [telegram, setTelegram] = useState("");
const [comment, setComment] = useState("");
  const [selectedPrice, setSelectedPrice] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
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

    <div className="text-lg text-yellow-400 font-semibold">
      ¥ {settings.yuanRate}
    </div>

    <div className="text-sm text-gray-300">
      € {settings.euroRate}
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

    <a href="#">
      Авто из Китая
    </a>

    <a href="#">
      Авто из Кореи
    </a>

    <a href="#">
      Авто из Японии
    </a>

    <div className="text-sm text-gray-300">
      ¥ {settings.yuanRate}
    </div>

    <div className="text-sm text-gray-300">
      € {settings.euroRate}
    </div>

    <a
      href="#request-form"
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
     {/* HERO */}
<section
  className="
    relative
    min-h-[600px]
    flex
    items-center
    px-10
    overflow-hidden
  "
>

        {/* BACKGROUND */}
        <img
          src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2000&auto=format&fit=crop"
          alt="car"
          className="
            absolute
            inset-0
            w-full
            h-full
            object-cover
          "
        />

        {/* DARK OVERLAY */}
        <div
          className="
            absolute
            inset-0
            bg-black/60
          "
        />

        {/* CONTENT */}
        <div className="relative z-10 max-w-3xl">

          <h2 className="text-5xl md:text-7xl font-bold leading-tight mb-8">
            Автомобили из Китая, Кореи и Японии
          </h2>

          <p className="text-xl text-gray-300 mb-10">
            Подбор, проверка и доставка автомобилей напрямую с зарубежных площадок.
          </p>

          <button
            className="
              bg-white
              text-black
              px-8
              py-4
              rounded-2xl
              text-xl
              font-semibold
              transition
              duration-300
              hover:bg-yellow-400
              hover:scale-105
            "
          >
            Смотреть автомобили
          </button>

        </div>
      </section>

      {/* CARS */}
      {/* CARS */}
<section className="px-10 py-20">

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

  <input
    type="text"
    placeholder="Марка авто"
    value={search}
onChange={(e) => setSearch(e.target.value)}
    className="
      bg-zinc-900
      border
      border-white/10
hover:border-yellow-400/50
focus:border-yellow-400
focus:shadow-lg
focus:shadow-yellow-400/10
      rounded-xl
      px-5
      py-3
      text-white
      outline-none
      focus:border-yellow-400
      transition
    "
  />

  <select
  value={selectedYear}
onChange={(e) => setSelectedYear(e.target.value)}
    className="
      bg-zinc-900
      border
      border-white/10
hover:border-yellow-400/50
focus:border-yellow-400
focus:shadow-lg
focus:shadow-yellow-400/10
      rounded-xl
      px-5
      py-3
      text-white
      outline-none
      focus:border-yellow-400
    "
  >
    <option value="">Все года</option>
    <option>2026</option>
<option>2025</option>
<option>2024</option>
<option>2023</option>
<option>2022</option>
<option>2021</option>
<option>2020</option>
<option>2019</option>
<option>2018</option>
<option>2017</option>
<option>2016</option>
<option>2015</option>
  </select>

  
  
    <select
  value={selectedPrice}
  onChange={(e) => setSelectedPrice(e.target.value)}
  className="
    bg-zinc-900
    border
    border-white/10
    hover:border-yellow-400/50
    focus:border-yellow-400
    focus:shadow-lg
    focus:shadow-yellow-400/10
    rounded-xl
    px-5
    py-3
    text-white
    outline-none
  "
>

  <option value="">Любая цена</option>
  <option value="100000">до ¥100 000</option>
  <option value="200000">до ¥200 000</option>
  <option value="300000">до ¥300 000</option>
  <option value="400000">до ¥400 000</option>
  <option value="500000">до ¥500 000</option>

</select>
<select
  value={selectedCountry}
  onChange={(e) => setSelectedCountry(e.target.value)}
  className="
    bg-zinc-900
    border
    border-white/10
    hover:border-yellow-400/50
    focus:border-yellow-400
    rounded-xl
    px-5
    py-3
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
  <button
    className="
      bg-yellow-400
      text-black
      px-6
      py-3
      rounded-xl
      font-bold
      hover:scale-105
      hover:shadow-xl
hover:shadow-yellow-400/20
      transition
      duration-300
    "
  >
    Найти ({cars
  .filter((car) => {

    const matchesSearch =
  car.title
    .toLowerCase()
    .includes(search.toLowerCase());
    const matchesYear =
      selectedYear === "" ||
      car.year === selectedYear;

    const carPrice = car.price;
    

    const matchesPrice =
      selectedPrice === "" ||
      carPrice <= Number(selectedPrice);

    const matchesCountry =
      selectedCountry === "" ||
      car.country === selectedCountry;

    

return (
  matchesSearch &&
  matchesYear &&
  matchesPrice &&
  matchesCountry
);

  }).length})
  </button>

</div>
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">

    {cars
  .filter((car) => {

    const matchesSearch =
      car.title
  .toLowerCase()
  .includes(search.toLowerCase());

    const matchesYear =
    selectedYear === "" ||
car.year === selectedYear;

const carPrice = car.price;


const matchesPrice =
  selectedPrice === "" ||
  carPrice <= Number(selectedPrice);


    return (
  matchesSearch &&
  matchesYear &&
  matchesPrice
);

  })
  .map((car) => (

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
          duration-500
          hover:scale-[1.02]
          hover:border-white/30
          hover:shadow-2xl
          hover:shadow-black/50
        "
      >

        {/* IMAGE */}
        <div className="relative overflow-hidden h-[420px]">

          <img
            src={car.image}
            alt={car.title}
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
              via-black/30
              to-transparent
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

            <h4 className="text-3xl font-bold mb-3">
              {getCarDisplayTitle(car.title)}
            </h4>

            {getCarLotNumber(car.title) && (
              <p className="text-sm text-gray-400 mb-3">
                Лот: {getCarLotNumber(car.title)}
              </p>
            )}

            <p className="text-3xl text-yellow-400 font-bold mb-4">
 ≈ {(car.price + car.delivery + car.fee).toLocaleString()} ₽
</p>

<p className="text-sm text-gray-400 mt-2">
  Цена в Китае: {car.price.toLocaleString()} ₽
</p>
  <p className="text-sm text-gray-400">
  Доставка: {(car.delivery || 0).toLocaleString()} ₽
</p>

<p className="text-sm text-gray-400">
  Комиссия и оформление: {(car.fee || 0).toLocaleString()} ₽
</p>

<p className="text-sm text-gray-500 mt-1">
  *Стоимость ориентировочная
</p>

            <div className="space-y-2 text-gray-300 text-lg mb-6">
              <p>Пробег: {car.mileage}</p>
              <p>Двигатель: {car.engine}</p>
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


    </main>
  );
}
