# VK Publish Workflow

## Назначение

Этот workflow описывает первый рабочий цикл публикации контента в VK AutoVector.

Цель:

Превратить идею в готовую публикацию для VK.

---

# Канал

Project:

AutoVector

Platform:

VK

Channel:

AutoVector

URL:

https://vk.com/club239860693

Status:

Active

Automation:

OFF

Current mode:

Manual publish required

---

# Источники данных

Workflow использует:

- app/data/content_queue.json
- app/data/social_channels.json
- AMOS/agents/trend_agent_v1.md
- AMOS/agents/content_agent_v2.md
- AMOS/agents/video_agent_v1.md
- AMOS/agents/publisher_agent_v1.md

---

# Условия запуска

Workflow запускается, если:

- в content_queue.json есть материал для VK;
- status материала = approved;
- VK в social_channels.json имеет status = active;
- VK имеет connected = true.

---

# Последовательность работы

## 1. Trend Agent

Задача:

Найти или подтвердить тему публикации.

Проверить:

- актуальность темы;
- интерес аудитории;
- связь с AutoVector;
- пользу для потенциального клиента.

Результат:

Тема подтверждена или отправлена на доработку.

---

## 2. Content Agent

Задача:

Подготовить текст VK-поста.

Требования:

- цепляющее начало;
- понятный язык;
- без перегруза;
- польза для клиента;
- CTA в конце.

Результат:

Готовый текст публикации.

---

## 3. Video Agent

Задача:

Определить визуальный материал.

Если imageRequired = true:

- подготовить промпт для изображения;
- указать формат;
- определить смысл картинки.

Если videoRequired = true:

- подготовить структуру вертикального видео.

Результат:

Промпт для изображения или сценарий видео.

---

## 4. Publisher Agent

Задача:

Проверить готовность публикации.

Проверить:

- текст готов;
- визуал готов;
- канал активен;
- публикация соответствует VK;
- automation = false.

Результат:

Manual publish required.

Publisher Agent передаёт Денису готовый комплект для ручной публикации.

---

# Формат результата

Publisher Agent должен выдать:

Канал:

VK AutoVector

Материал:

Название публикации

Текст поста:

...

Визуал:

...

CTA:

...

Статус:

Manual publish required

Следующее действие:

Опубликовать вручную в VK.

---

# После публикации

После ручной публикации Денис должен обновить материал в content_queue.json:

status:

published

publishedAt:

YYYY-MM-DD

publishedUrl:

ссылка на пост VK

---

# KPI

Минимум:

1 публикация в VK в день.

Цель первой недели:

7 публикаций.

Цель первого месяца:

30 публикаций.

---

# Правило

Сначала ручной режим.

API и автоматизация подключаются только после того, как ручной workflow стабильно работает.
