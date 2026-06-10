import { NextResponse } from "next/server";

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function buildMessage(body: Record<string, string>) {
  if (body.type === "reservation") {
    return `
🔥 Заявка с сайта AutoVector

Новая бронь авто

Авто: ${body.carTitle}
ID автомобиля: ${body.carId}
${body.lotNumber ? `Лот: ${body.lotNumber}` : ""}
Ссылка на автомобиль: ${body.carUrl}

Имя клиента: ${body.name}
Телефон: ${body.phone}
Telegram/MAX: ${body.contact}
Комментарий: ${body.comment}
`;
  }

  return `
🔥 Заявка с сайта AutoVector

🚗 Новая заявка

👤 Имя: ${body.name}

💰 Бюджет: ${body.budget}

🚘 Авто: ${body.carRequest}

📱 Телефон: ${body.phone}

✈ Telegram: ${body.telegram}

💬 Комментарий: ${body.comment}

${body.carId ? `ID автомобиля: ${body.carId}` : ""}
${body.carUrl ? `Ссылка на автомобиль: ${body.carUrl}` : ""}
`;
}

export async function POST(req: Request) {
  try {
    if (!TELEGRAM_TOKEN || !CHAT_ID) {
      console.error("[api/request] Telegram is not configured", {
        hasToken: Boolean(TELEGRAM_TOKEN),
        hasChatId: Boolean(CHAT_ID),
      });

      return NextResponse.json(
        {
          success: false,
          error: "Telegram is not configured",
        },
        {
          status: 500,
        }
      );
    }

    const body = await req.json();
    const message = buildMessage(body);

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
        }),
      }
    );

    if (!telegramResponse.ok) {
      const telegramError = await telegramResponse.text().catch(() => "");

      console.error("[api/request] Telegram sendMessage failed", {
        status: telegramResponse.status,
        telegramError,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Telegram sendMessage failed",
        },
        {
          status: 502,
        }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("[api/request] Request failed", error);

    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}
