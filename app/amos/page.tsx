const overviewCards = [
  {
    label: "Лиды сегодня",
    value: "12",
    detail: "4 горячих лида ждут ответа менеджера",
  },
  {
    label: "Контент на проверке",
    value: "7",
    detail: "Посты, сценарии и обложки на review",
  },
  {
    label: "Опубликовано сегодня",
    value: "3",
    detail: "Telegram, VK и Shorts в очереди отчета",
  },
  {
    label: "Активные агенты",
    value: "9",
    detail: "Все ключевые агенты доступны",
  },
  {
    label: "Фокус месяца",
    value: "Honda / Toyota",
    detail: "Расширить каталог и довести лиды до созвона",
  },
];

const contentRows = [
  {
    title: "Toyota RAV4: почему подходит семье",
    channel: "Telegram",
    status: "Idea",
    owner: "Trend Agent",
    due: "Сегодня",
  },
  {
    title: "BMW X1 под ключ: короткий продающий пост",
    channel: "Telegram",
    status: "Draft",
    owner: "Content Agent",
    due: "Сегодня",
  },
  {
    title: "Видео-карусель Honda Civic",
    channel: "Shorts",
    status: "Review",
    owner: "Video Agent",
    due: "Завтра",
  },
  {
    title: "Что проверить перед покупкой авто из Китая",
    channel: "VK",
    status: "Approved",
    owner: "Research Agent",
    due: "24 июня",
  },
  {
    title: "Volkswagen Tiguan L: расчет под ключ",
    channel: "Telegram",
    status: "Scheduled",
    owner: "Publisher Agent",
    due: "25 июня",
  },
  {
    title: "Подбор авто без риска и переплат",
    channel: "MAX",
    status: "Published",
    owner: "Publisher Agent",
    due: "Вчера",
  },
];

const leadRows = [
  {
    name: "Анна",
    request: "Toyota RAV4 до 2.5 млн",
    source: "Telegram",
    status: "Новый",
    next: "Ответить до 12:30",
  },
  {
    name: "Игорь",
    request: "BMW X1, 2021-2023",
    source: "Сайт",
    status: "Квалификация",
    next: "Уточнить бюджет",
  },
  {
    name: "Марина",
    request: "Семейный кроссовер",
    source: "VK",
    status: "Подбор автомобиля",
    next: "Отправить 3 варианта",
  },
  {
    name: "Сергей",
    request: "Honda Civic",
    source: "Сайт",
    status: "Созвон назначен",
    next: "Созвон в 18:00",
  },
  {
    name: "Ольга",
    request: "Toyota Camry",
    source: "Telegram",
    status: "Задаток получен",
    next: "Проверить лот",
  },
  {
    name: "Дмитрий",
    request: "BMW 7 Series",
    source: "Рекомендация",
    status: "Потерян",
    next: "Вернуться через 30 дней",
  },
];

const agents = [
  {
    name: "Trend Agent",
    status: "Ежедневно",
    task: "Собрать темы для коротких продающих постов",
    next: "09:00",
  },
  {
    name: "Market Agent",
    status: "Ежедневно",
    task: "Проверить спрос на Honda, Toyota и Volkswagen",
    next: "09:15",
  },
  {
    name: "Research Agent",
    status: "По запросу",
    task: "Подготовить бриф по Toyota RAV4",
    next: "После задачи",
  },
  {
    name: "Content Agent",
    status: "Ежедневно",
    task: "Собрать 3 поста для Telegram",
    next: "11:00",
  },
  {
    name: "Video Agent",
    status: "Ежедневно",
    task: "Собрать MP4-карусель для следующего авто",
    next: "12:30",
  },
  {
    name: "Publisher Agent",
    status: "Ежедневно",
    task: "Опубликовать следующий автомобиль в Telegram",
    next: "13:00",
  },
  {
    name: "Sales Agent",
    status: "По событию",
    task: "Подготовить лиды к первому контакту",
    next: "При новом лиде",
  },
  {
    name: "Analytics Agent",
    status: "Ежедневно",
    task: "Собрать эффективность публикаций",
    next: "20:00",
  },
  {
    name: "Engineering Agent",
    status: "По запросу",
    task: "Поддерживать сайт, пайплайн и автоматизации",
    next: "После задачи",
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
      className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${
        statusStyles[status] || "border-white/15 bg-white/5 text-white/70"
      }`}
    >
      {status}
    </span>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-yellow-400/90">
        {eyebrow}
      </p>
      <h2 className="text-xl font-semibold text-white md:text-2xl">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
        {description}
      </p>
    </div>
  );
}

export default function AmosDashboardPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/85 px-6 py-4 backdrop-blur-xl md:px-10">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-yellow-400">
              AMOS
            </p>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">
              Mission Control
            </h1>
          </div>

          <nav className="flex gap-2 overflow-x-auto text-sm text-zinc-300">
            {["Overview", "Content", "Leads", "Agents"].map((item) => (
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

      <div className="mx-auto w-full max-w-[1600px] px-6 py-6 md:px-10 md:py-8">
        <section className="mb-6 rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.16),transparent_30%),linear-gradient(135deg,#111111,#050505)] p-5 shadow-2xl shadow-black/30 md:p-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-yellow-400/90">
            AutoVector Operating System
          </p>
          <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <h2 className="max-w-4xl text-3xl font-semibold leading-tight md:text-4xl">
                Управлять бизнесом, а не тонуть в рутине.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-300 md:text-base">
                AMOS Dashboard собирает обзор состояния, контент, лиды и
                агентов в одном рабочем центре принятия решений.
              </p>
            </div>

            <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-yellow-200">
                Формула
              </p>
              <p className="mt-3 text-lg font-semibold leading-relaxed md:text-xl">
                Данные → Инсайты → Решения → Действия → Результат
              </p>
            </div>
          </div>
        </section>

        <section id="overview" className="scroll-mt-28 py-4">
          <SectionTitle
            eyebrow="Overview"
            title="Операционная сводка"
            description="Короткий экран для утреннего решения: что требует внимания прямо сейчас."
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
            {overviewCards.map((card) => (
              <article
                key={card.label}
                className="rounded-2xl border border-white/10 bg-zinc-950 p-4 shadow-xl shadow-black/20"
              >
                <p className="text-sm text-zinc-400">{card.label}</p>
                <p className="mt-3 text-2xl font-black text-white">
                  {card.value}
                </p>
                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  {card.detail}
                </p>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-4 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)] xl:items-start">
          <div className="space-y-6">
            <section id="content" className="scroll-mt-28">
              <SectionTitle
                eyebrow="Content"
                title="Content Board"
                description="Пайплайн публикаций: от идеи до опубликованного поста."
              />

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-[0.16em] text-zinc-500">
                      <tr>
                        <th className="px-4 py-3">Материал</th>
                        <th className="px-4 py-3">Канал</th>
                        <th className="px-4 py-3">Статус</th>
                        <th className="px-4 py-3">Агент</th>
                        <th className="px-4 py-3">Срок</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {contentRows.map((row) => (
                        <tr key={row.title} className="hover:bg-white/[0.025]">
                          <td className="px-4 py-3 font-medium text-white">
                            {row.title}
                          </td>
                          <td className="px-4 py-3 text-zinc-400">
                            {row.channel}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={row.status} />
                          </td>
                          <td className="px-4 py-3 text-zinc-400">
                            {row.owner}
                          </td>
                          <td className="px-4 py-3 text-zinc-400">{row.due}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section id="leads" className="scroll-mt-28">
              <SectionTitle
                eyebrow="Leads"
                title="Leads Board"
                description="Статусы клиентов от первого обращения до задатка или потери сделки."
              />

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-[0.16em] text-zinc-500">
                      <tr>
                        <th className="px-4 py-3">Клиент</th>
                        <th className="px-4 py-3">Запрос</th>
                        <th className="px-4 py-3">Источник</th>
                        <th className="px-4 py-3">Статус</th>
                        <th className="px-4 py-3">Следующий шаг</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {leadRows.map((row) => (
                        <tr
                          key={`${row.name}-${row.request}`}
                          className="hover:bg-white/[0.025]"
                        >
                          <td className="px-4 py-3 font-medium text-white">
                            {row.name}
                          </td>
                          <td className="px-4 py-3 text-zinc-400">
                            {row.request}
                          </td>
                          <td className="px-4 py-3 text-zinc-400">
                            {row.source}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={row.status} />
                          </td>
                          <td className="px-4 py-3 text-zinc-400">{row.next}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>

          <aside className="xl:sticky xl:top-24">
            <section id="agents" className="scroll-mt-28">
              <SectionTitle
                eyebrow="Agents"
                title="Agent Command Center"
                description="Состояние агентов, последняя задача и следующий запуск."
              />

              <div className="grid gap-3">
                {agents.map((agent) => (
                  <article
                    key={agent.name}
                    className="rounded-2xl border border-white/10 bg-zinc-950 p-4 shadow-xl shadow-black/20"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-white">
                          {agent.name}
                        </h3>
                        <p className="mt-1 text-xs text-zinc-500">
                          Следующий запуск: {agent.next}
                        </p>
                      </div>
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                        {agent.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-5 text-zinc-400">
                      {agent.task}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
