# AutoVector

MVP сайта подбора и витрины автомобилей из Китая, Кореи и Японии.

## Локальный запуск

```bash
npm install
npm run dev
```

Откройте `http://localhost:3000`.

## Подготовка к деплою

```bash
npm ci
npm run lint
npm run build
```

Для работы формы заявки задайте переменные окружения из `.env.example`:

- `TELEGRAM_TOKEN` - токен Telegram-бота.
- `TELEGRAM_CHAT_ID` - chat id, куда отправлять заявки.
- `TELEGRAM_CHANNEL_ID` - канал для скрипта публикации авто.
- `MANAGER_URL` - ссылка на менеджера в Telegram.

## Деплой на Vercel

1. Импортируйте папку проекта в Vercel как Next.js приложение.
2. Добавьте переменные окружения из `.env.example`.
3. Запустите production build командой `npm run build`.

В проект не входят локальные артефакты `.next` и `node_modules`; зависимости ставятся на стороне платформы по `package-lock.json`.
