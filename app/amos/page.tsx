import carsData from "../data/cars.json";
import contentQueueData from "../data/content_queue.json";
import leadsData from "../../AMOS/data/leads.json";

const CNY_TO_RUB = 10.5;
const RUSSIA_DELIVERY_COST_RUB = 900_000;

const cars = carsData;
const contentQueue = contentQueueData;
const leads = leadsData;
const hotLeadCount = leads.filter(
  (lead) => lead.temperature.toLowerCase() === "hot",
).length;
const brands = [...new Set(cars.map((car) => car.brand).filter(Boolean))];
const brandCounts = cars.reduce<Record<string, number>>((counts, car) => {
  if (car.brand) {
    counts[car.brand] = (counts[car.brand] || 0) + 1;
  }
  return counts;
}, {});
const averageRussiaPrice = cars.length
  ? Math.round(
      cars.reduce(
        (total, car) =>
          total +
          (Number(car.price) || 0) * CNY_TO_RUB +
          RUSSIA_DELIVERY_COST_RUB,
        0,
      ) / cars.length,
    )
  : 0;
const latestCars = [...cars]
  .sort((a, b) => Number(b.id) - Number(a.id))
  .slice(0, 5);

const formatRubPrice = (value: number) =>
  `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;

const contentStatuses = [
  { key: "idea", label: "Ideas" },
  { key: "draft", label: "Drafts" },
  { key: "review", label: "Review" },
  { key: "approved", label: "Approved" },
  { key: "published", label: "Published" },
];
const contentStatusCounts = Object.fromEntries(
  contentStatuses.map(({ key }) => [
    key,
    contentQueue.filter((item) => item.status.toLowerCase() === key).length,
  ]),
);
const formatContentStatus = (status: string) =>
  status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

const overviewCards = [
  {
    label: "ЛИДЫ СЕГОДНЯ",
    value: String(leads.length),
    detail: `🔥 Hot: ${hotLeadCount}`,
  },
  {
    label: "НА ПРОВЕРКЕ",
    value: String(contentStatusCounts.review),
    detail: "Content review",
  },
  {
    label: "ОПУБЛИКОВАНО",
    value: String(contentStatusCounts.published),
    detail: "Content queue",
  },
  {
    label: "АГЕНТЫ",
    value: "9",
    detail: "Online",
  },
  {
    label: "КАТАЛОГ",
    value: String(cars.length),
    detail: `${brands.length} бренда`,
  },
];

const agents = [
  {
    name: "Trend Agent",
    status: "Ежедневно",
    task: "Темы для коротких продающих постов",
    next: "09:00",
  },
  {
    name: "Market Agent",
    status: "Ежедневно",
    task: "Спрос на Honda, Toyota и Volkswagen",
    next: "09:15",
  },
  {
    name: "Research Agent",
    status: "По запросу",
    task: "Бриф по Toyota RAV4",
    next: "После задачи",
  },
  {
    name: "Content Agent",
    status: "Ежедневно",
    task: "3 поста для Telegram",
    next: "11:00",
  },
  {
    name: "Video Agent",
    status: "Ежедневно",
    task: "MP4-карусель для следующего авто",
    next: "12:30",
  },
  {
    name: "Publisher Agent",
    status: "Ежедневно",
    task: "Следующая публикация в Telegram",
    next: "13:00",
  },
  {
    name: "Sales Agent",
    status: "По событию",
    task: "Подготовить лиды к первому контакту",
    next: "Новый лид",
  },
  {
    name: "Analytics Agent",
    status: "Ежедневно",
    task: "Эффективность публикаций",
    next: "20:00",
  },
  {
    name: "Engineering Agent",
    status: "По запросу",
    task: "Сайт, pipeline и автоматизации",
    next: "После задачи",
  },
];

const widgets = [
  {
    title: "Tasks",
    value: "8 открыто",
    detail: "2 срочные задачи требуют решения сегодня.",
    items: ["Проверить домен autovector.pro", "Подготовить 3 поста на неделю"],
  },
  {
    title: "Reports",
    value: "Daily готов",
    detail: "Weekly report запланирован на воскресенье.",
    items: ["Telegram: +3 публикации", "Лиды: +12 за сутки"],
  },
];

const statusStyles: Record<string, string> = {
  Idea: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  Draft: "border-zinc-400/30 bg-zinc-400/10 text-zinc-200",
  Review: "border-yellow-400/40 bg-yellow-400/10 text-yellow-200",
  Approved: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  Scheduled: "border-violet-400/30 bg-violet-400/10 text-violet-200",
  Published: "border-green-400/30 bg-green-400/10 text-green-200",
  Новый: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  Квалификация: "border-yellow-400/40 bg-yellow-400/10 text-yellow-200",
  "Подбор автомобиля": "border-violet-400/30 bg-violet-400/10 text-violet-200",
  "Созвон назначен": "border-indigo-400/30 bg-indigo-400/10 text-indigo-200",
  "Задаток получен": "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  Потерян: "border-red-400/30 bg-red-400/10 text-red-200",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${
        statusStyles[status] || "border-white/15 bg-white/5 text-white/70"
      }`}
    >
      {status}
    </span>
  );
}

function PanelTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-yellow-400/90">
          {eyebrow}
        </p>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-zinc-400">{description}</p>
      </div>
    </div>
  );
}

export default function AmosDashboardPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/85 px-6 py-3 backdrop-blur-xl md:px-10">
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-yellow-400">
              AMOS
            </p>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">
              Mission Control
            </h1>
          </div>

          <nav className="flex gap-2 overflow-x-auto text-sm text-zinc-300">
            {["Overview", "Catalog", "Content", "Leads", "Agents"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 transition hover:border-yellow-400/50 hover:text-yellow-300"
              >
                {item}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div className="w-full max-w-none px-6 py-5 md:px-10">
        <section className="mb-5 rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.14),transparent_28%),linear-gradient(135deg,#111111,#050505)] p-5 shadow-2xl shadow-black/30">
          <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-yellow-400/90">
                AutoVector Operating System
              </p>
              <h2 className="max-w-4xl text-3xl font-semibold leading-tight md:text-4xl">
                Управлять бизнесом, а не тонуть в рутине.
              </h2>
              <p className="mt-3 max-w-4xl text-base leading-7 text-zinc-300">
                AMOS собирает обзор, контент, лиды и агентов в одном рабочем центре решений.
              </p>
            </div>

            <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-yellow-200">
                Формула
              </p>
              <p className="mt-2 text-base font-semibold leading-relaxed md:text-lg">
                Данные → Инсайты → Решения → Действия → Результат
              </p>
            </div>
          </div>
        </section>

        <section id="overview" className="scroll-mt-24">
          <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
            {overviewCards.map((card) => (
              <article
                key={card.label}
                className="rounded-2xl border border-white/10 bg-zinc-950 p-4 shadow-xl shadow-black/20"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  {card.label}
                </p>
                <p className="mt-3 text-3xl font-black text-white">
                  {card.value}
                </p>
                <p className="mt-2 text-sm font-medium leading-5 text-zinc-300">
                  {card.detail}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
          <div
            id="content"
            className="scroll-mt-24 rounded-2xl border border-white/10 bg-zinc-950 p-5"
          >
            <PanelTitle
              eyebrow="Content"
              title="Content Board"
              description={`${contentQueue.length} материалов в локальной очереди.`}
            />

            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {contentStatuses.map(({ key, label }) => (
                <article
                  key={key}
                  className="rounded-xl border border-white/10 bg-white/[0.025] p-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                    {label}
                  </p>
                  <p className="mt-1 text-2xl font-black text-white">
                    {contentStatusCounts[key]}
                  </p>
                </article>
              ))}
            </div>

            {contentQueue.length > 0 ? (
              <div className="max-h-[360px] overflow-auto rounded-xl border border-white/10">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950 text-xs uppercase tracking-[0.14em] text-zinc-400">
                    <tr>
                      <th className="px-4 py-3">Материал</th>
                      <th className="px-4 py-3">Проект</th>
                      <th className="px-4 py-3">Канал</th>
                      <th className="px-4 py-3">Статус</th>
                      <th className="px-4 py-3">Дата</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {contentQueue.map((item) => {
                      const displayStatus = formatContentStatus(item.status);

                      return (
                        <tr key={item.id} className="hover:bg-white/[0.025]">
                          <td className="px-4 py-3 text-base font-semibold text-white">
                            {item.title}
                          </td>
                          <td className="px-4 py-3 text-base text-zinc-300">
                            {item.project}
                          </td>
                          <td className="px-4 py-3 text-base text-zinc-300">
                            {item.channel}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={displayStatus} />
                          </td>
                          <td className="px-4 py-3 text-base text-zinc-300">
                            {item.plannedDate}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
                <div>
                  <p className="text-lg font-semibold text-white">
                    Очередь контента пуста
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    Добавьте записи в app/data/content_queue.json.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div
            id="leads"
            className="scroll-mt-24 rounded-2xl border border-white/10 bg-zinc-950 p-5"
          >
            <PanelTitle
              eyebrow="Leads"
              title="Leads Board"
              description={`${leads.length} лидов · ${hotLeadCount} горячих`}
            />

            {leads.length > 0 ? (
              <div className="max-h-[360px] overflow-auto rounded-xl border border-white/10">
                <table className="w-full table-fixed text-left text-sm">
                  <thead className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950 text-xs uppercase tracking-[0.14em] text-zinc-400">
                    <tr>
                      <th className="px-4 py-3">Клиент</th>
                      <th className="px-4 py-3">Интерес</th>
                      <th className="px-4 py-3">Бюджет</th>
                      <th className="px-4 py-3">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {leads.slice(0, 5).map((lead) => (
                      <tr key={lead.id} className="hover:bg-white/[0.025]">
                        <td className="px-4 py-3 text-base font-semibold text-white">
                          <span className="flex items-center gap-2">
                            {lead.temperature === "hot" && (
                              <span aria-label="Горячий лид">🔥</span>
                            )}
                            {lead.name}
                          </span>
                          <div className="mt-1 text-xs font-medium text-zinc-500">
                            {lead.source} · {lead.createdAt}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-base text-zinc-300">
                          {lead.interest}
                        </td>
                        <td className="px-4 py-3 text-base font-medium text-zinc-200">
                          {lead.budget}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={lead.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
                <div>
                  <p className="text-lg font-semibold text-white">
                    Лидов пока нет
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    Добавьте записи в AMOS/data/leads.json.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div
            id="agents"
            className="scroll-mt-24 rounded-2xl border border-white/10 bg-zinc-950 p-5"
          >
            <PanelTitle
              eyebrow="Agents"
              title="Agent Command Center"
              description="Все агенты в компактной операционной колонке."
            />

            <div className="max-h-[360px] space-y-3 overflow-auto pr-1">
              {agents.map((agent) => (
                <article
                  key={agent.name}
                  className="rounded-xl border border-white/10 bg-white/[0.025] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {agent.name}
                      </h3>
                      <p className="mt-1 text-sm font-medium text-zinc-400">
                        Запуск: {agent.next}
                      </p>
                    </div>
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                      {agent.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-300">
                    {agent.task}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="catalog"
          className="mt-5 scroll-mt-24 rounded-2xl border border-white/10 bg-zinc-950 p-5"
        >
          <PanelTitle
            eyebrow="Catalog Intelligence"
            title="Каталог в реальном времени"
            description="Сводка напрямую из app/data/cars.json."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
            {[
              { label: "Всего авто", value: cars.length },
              { label: "Брендов", value: brands.length },
              { label: "Toyota", value: brandCounts.Toyota || 0 },
              { label: "Honda", value: brandCounts.Honda || 0 },
              { label: "BMW", value: brandCounts.BMW || 0 },
              {
                label: "Средняя цена",
                value: formatRubPrice(averageRussiaPrice),
              },
            ].map((metric) => (
              <article
                key={metric.label}
                className="rounded-xl border border-white/10 bg-white/[0.025] p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  {metric.label}
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {metric.value}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
            <div className="border-b border-white/10 bg-white/[0.025] px-4 py-3">
              <h3 className="text-lg font-semibold text-white">
                Последние 5 автомобилей
              </h3>
            </div>
            <div className="grid divide-y divide-white/10 lg:grid-cols-5 lg:divide-x lg:divide-y-0">
              {latestCars.map((car) => {
                const priceRub =
                  (Number(car.price) || 0) * CNY_TO_RUB +
                  RUSSIA_DELIVERY_COST_RUB;

                return (
                  <article key={car.id} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-yellow-400">
                        ID {car.id}
                      </span>
                      <span className="text-xs text-zinc-500">{car.brand}</span>
                    </div>
                    <h4 className="mt-2 text-base font-semibold leading-6 text-white">
                      {car.title}
                    </h4>
                    <p className="mt-2 text-sm font-medium text-zinc-300">
                      ≈ {formatRubPrice(priceRub)}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-2">
          {widgets.map((widget) => (
            <article
              key={widget.title}
              className="rounded-2xl border border-white/10 bg-zinc-950 p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-yellow-400/90">
                {widget.title}
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-white">
                {widget.value}
              </h3>
              <p className="mt-2 text-base leading-7 text-zinc-300">
                {widget.detail}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-zinc-400">
                {widget.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
