import { settings } from "./settings";
export const cars = [
  {
  id: 1,
  title: "BMW 1 series 2023",
  price: "¥ 89 800",
  priceRu:
  Math.round(
    (
      Number("89800") *
      settings.yuanRate +
      settings.deliveryCost +
      settings.managerFee
    ) / 10000
  ) * 10000,
  mileage: "39 990 км",
  engine: "1500 см³",

  year: "2023",
  power: "140 л.с.",
  fuel: "Бензин",
  transmission: "Автомат",
  drive: "Передний",
  color: "Белый",
country: "Китай",
  images: [
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1400&auto=format&fit=crop",
    ],
  },

  {
    id: 2,
    title: "BMW X1 2022",
    price: "¥ 124 900",
    priceRu:
  Math.round(
    (
      Number("89800") *
      settings.yuanRate +
      settings.deliveryCost +
      settings.managerFee
    ) / 10000
  ) * 10000,
    mileage: "44 000 км",
    engine: "1500 см³",
    year: "2022",
    power: "192 л.с.",
    fuel: "Бензин",
    transmission: "Автомат",
    drive: "Полный",
    color: "Черный",
    country: "Корея",
    images: [
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1494905998402-395d579af36f?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=1400&auto=format&fit=crop",
    ],
  },

  {
    id: 3,
    title: "BMW 1 series 2022",
    price: "¥ 99 800",
    priceRu:
  Math.round(
    (
      Number("89800") *
      settings.yuanRate +
      settings.deliveryCost +
      settings.managerFee
    ) / 10000
  ) * 10000,
    mileage: "68 000 км",
    engine: "1500 см³",
    year: "2022",
    power: "140 л.с.",
    fuel: "Бензин",
    transmission: "Автомат",
    drive: "Передний",
    color: "Синий",
    country: "Япония",
    images: [
      "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1553440569-bcc63803a83d?q=80&w=1400&auto=format&fit=crop",
    ],
  },
];