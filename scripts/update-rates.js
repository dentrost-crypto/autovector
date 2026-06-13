const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const RATES_PATH = path.join(ROOT_DIR, "app", "data", "rates.json");
const CBR_URL = "https://www.cbr.ru/scripts/XML_daily.asp";

function readExistingRates() {
  if (!fs.existsSync(RATES_PATH)) {
    return {
      CNY: 11.4,
      EUR: 98.7,
      source: "fallback",
      updatedAt: null,
    };
  }

  return JSON.parse(fs.readFileSync(RATES_PATH, "utf8"));
}

function parseRate(xml, charCode) {
  const match = xml.match(
    new RegExp(
      `<Valute[^>]*>[\\s\\S]*?<CharCode>${charCode}<\\/CharCode>[\\s\\S]*?<Nominal>(\\d+)<\\/Nominal>[\\s\\S]*?<Value>([\\d,]+)<\\/Value>[\\s\\S]*?<\\/Valute>`,
      "i"
    )
  );

  if (!match) {
    throw new Error(`Rate ${charCode} not found in CBR XML.`);
  }

  const nominal = Number(match[1]);
  const value = Number(match[2].replace(",", "."));

  if (!Number.isFinite(nominal) || nominal <= 0 || !Number.isFinite(value)) {
    throw new Error(`Rate ${charCode} has invalid value.`);
  }

  return Number((value / nominal).toFixed(4));
}

async function main() {
  const existingRates = readExistingRates();

  try {
    const response = await fetch(CBR_URL, {
      headers: {
        "User-Agent": "AutoVector rates updater",
        Accept: "application/xml,text/xml,*/*",
      },
    });

    if (!response.ok) {
      throw new Error(`CBR responded with HTTP ${response.status}`);
    }

    const xml = await response.text();
    const rates = {
      CNY: parseRate(xml, "CNY"),
      EUR: parseRate(xml, "EUR"),
      source: CBR_URL,
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(RATES_PATH, `${JSON.stringify(rates, null, 2)}\n`, "utf8");
    console.log("Rates updated:");
    console.log(`- CNY: ${rates.CNY}`);
    console.log(`- EUR: ${rates.EUR}`);
  } catch (error) {
    fs.writeFileSync(
      RATES_PATH,
      `${JSON.stringify(existingRates, null, 2)}\n`,
      "utf8"
    );
    console.error("Failed to update rates. Keeping existing saved values.");
    console.error(error instanceof Error ? error.message : error);
  }
}

main();
