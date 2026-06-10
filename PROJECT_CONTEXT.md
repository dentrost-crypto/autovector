# PROJECT_CONTEXT.md

# AutoVector — Project Context

## Project Overview

AutoVector — это витрина и сервис подбора автомобилей из Китая, Кореи и Японии.

Проект ориентирован на:

* каталог автомобилей;
* лидогенерацию;
* Telegram / MAX / direct-contact заявки;
* дальнейшую интеграцию AI-подбора автомобилей;
* масштабирование до сотен карточек авто.

Текущая архитектура:

* frontend на Next.js;
* данные автомобилей генерируются парсером;
* сайт деплоится на Vercel;
* парсер собирает автомобили с Korex;
* изображения постепенно переводятся с remote URL на локальное хранение.

---

# Current Status

## Что уже работает

* главная страница;
* hero section;
* responsive mobile layout;
* mobile hamburger menu;
* блок "О нас";
* блок "Как проходит сделка";
* каталог автомобилей;
* карточки автомобилей;
* страницы отдельных авто;
* fallback image system;
* deploy на Vercel;
* DEBUG режим на 5 автомобилей;
* фильтрация автомобилей;
* local JSON data pipeline.

---

# Current Problems

## Основная текущая проблема

Remote изображения с:

https://cn2.pa-server.ru

нестабильно загружаются:

* fetch failed;
* Vercel периодически теряет фото;
* браузер видит изображения, Node fetch — нет.

---

# Current Main Task

## Перевести изображения на локальное хранение

Нужно:

* скачивать изображения прямо во время Playwright-парсинга;
* сохранять локально:
  /public/uploads/cars/{id}/1.webp
* использовать локальные пути в JSON;
* хранить только 3–4 фото на авто;
* оптимизировать размер изображений.

---

# Tech Stack

## Frontend

* Next.js 15+
* React
* TypeScript
* TailwindCSS

## Backend / Parsing

* Python
* Playwright

## Deployment

* Vercel

## Other

* Node.js 22+
* npm
* VS Code
* GitHub
* Mullvad VPN

---

# Project Paths

## Main Project

C:\Users\Den\Documents\Codex\2026-06-05\mvp-car-site-autovector\outputs\autovector

## Parser

C:\Users\Den\Desktop\car_parser

---

# Directory Structure

## /app

Основной frontend Next.js

### /app/page.tsx

Главная страница:

* hero;
* каталог;
* about;
* footer.

### /app/car/[id]/page.tsx

Страница отдельного автомобиля.

### /app/globals.css

Глобальные стили и анимации.

---

## /public

Статические файлы.

### /public/uploads/cars

Локальные изображения автомобилей.

Структура:

* /public/uploads/cars/1/1.webp
* /public/uploads/cars/1/2.webp

---

## /scripts

Node scripts.

### excel-to-json.js

Конвертация Excel → cars.json

### download-images.js

Экспериментальный downloader изображений.

---

## /data

JSON данные автомобилей.

### cars.json

Главный источник данных frontend.

---

# Parser Pipeline

## Текущий pipeline

1. Playwright открывает Korex
2. Парсит карточки
3. Собирает:

   * title
   * year
   * mileage
   * price
   * images
4. Создаёт Excel
5. excel-to-json.js создаёт cars.json
6. Next.js отображает данные

---

# DEBUG Mode

Используется:

DEBUG_LIMIT = 5

Причина:

* ускорение разработки;
* меньше лагов;
* быстрее rebuild;
* проще диагностика изображений.

---

# Image Strategy

## Текущая стратегия

Использовать:

* только 3–4 фото на автомобиль;
* локальные webp изображения;
* fallback.svg только как резерв.

## Не использовать

* десятки remote изображений;
* прямой hotlink на Korex;
* большие оригинальные размеры.

---

# Planned Scaling Strategy

## Каталог

План:

* 20 популярных марок;
* по 5 автомобилей каждой модели;
* витрина вместо бесконечного каталога.

## Будущее

* AI подбор авто;
* Telegram интеграция;
* CRM;
* автообновление каталога;
* автоматическая загрузка изображений;
* генерация SEO страниц.

---

# Coding Standards

## Общие правила

* не ломать существующий UI;
* минимальные точечные изменения;
* сначала диагностика, потом правка;
* не переписывать большие куски без необходимости.

---

## Frontend

* использовать TailwindCSS;
* сохранять responsive layout;
* mobile-first подход;
* избегать конфликтующих transform animation.

---

## Images

* prefer local images;
* webp format;
* object-cover;
* fallback только через onError.

---

## Parser

* Playwright preferred;
* избегать обычного fetch для cn2.pa-server.ru;
* скачивать изображения внутри browser context.

---

# Important Notes

## Hero Animation

Hero background использует:

* autovector-soft-zoom

НЕ трогать без необходимости.

---

## Mobile

На mobile:

* меню должно закрываться после клика;
* layout должен быть в одну колонку;
* изображения не должны исчезать.

---

# Deployment

## Deploy Flow

1. local test
2. npm run build
3. git add .
4. git commit
5. git push
6. Vercel auto deploy

---

# Recommended Workflow

## Разделение задач по чатам

Рекомендуется:

* отдельный чат frontend;
* отдельный чат parser;
* отдельный чат marketing;
* отдельный чат AI/automation.

---

# Current Priority

1. Исправить локальные изображения
2. Стабилизировать каталог
3. Вернуть галерею 3–4 фото
4. Оптимизировать mobile UX
5. Масштабировать каталог
