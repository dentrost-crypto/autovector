import { NextResponse } from "next/server";

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function POST(req: Request) {

  try {
    if (!TELEGRAM_TOKEN || !CHAT_ID) {
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

    const message = `
🚗 Новая заявка

👤 Имя: ${body.name}

💰 Бюджет: ${body.budget}

🚘 Авто: ${body.carRequest}

📱 Телефон: ${body.phone}

✈ Telegram: ${body.telegram}

💬 Комментарий: ${body.comment}

`;

    await fetch(
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

    return NextResponse.json({
      success: true,
    });

  } catch (error) {

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
