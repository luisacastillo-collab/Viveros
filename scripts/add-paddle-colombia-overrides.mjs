const PADDLE_API_KEY = process.env.PADDLE_API_KEY;
const PADDLE_API_BASE_URL = process.env.PADDLE_API_BASE_URL || "https://sandbox-api.paddle.com";

if (!PADDLE_API_KEY) {
  console.error("Missing PADDLE_API_KEY. Set it before running this script.");
  process.exit(1);
}

if (!PADDLE_API_KEY.includes("_sdbx") && process.env.ALLOW_NON_SANDBOX !== "true") {
  console.error("This script is intended for Paddle Sandbox. Your API key does not look like a sandbox key.");
  process.exit(1);
}

const prices = [
  {
    plan: "Starter",
    cycle: "Monthly",
    id: "pri_01kxk45vaw7e6x1ytzwhc44prz",
    overrides: [
      { country_codes: ["GB"], unit_price: { amount: "800", currency_code: "GBP" } },
      { country_codes: ["IE"], unit_price: { amount: "900", currency_code: "EUR" } },
      { country_codes: ["AU"], unit_price: { amount: "1400", currency_code: "AUD" } },
      { country_codes: ["CO"], unit_price: { amount: "2900000", currency_code: "COP" } },
    ],
  },
  {
    plan: "Starter",
    cycle: "Annual",
    id: "pri_01kxk45vgxnrcjxj989dhf4rc3",
    overrides: [
      { country_codes: ["GB"], unit_price: { amount: "8000", currency_code: "GBP" } },
      { country_codes: ["IE"], unit_price: { amount: "9000", currency_code: "EUR" } },
      { country_codes: ["AU"], unit_price: { amount: "14000", currency_code: "AUD" } },
      { country_codes: ["CO"], unit_price: { amount: "29000000", currency_code: "COP" } },
    ],
  },
  {
    plan: "Pro",
    cycle: "Monthly",
    id: "pri_01kxk45vvkwx8wec3aw5brp9jj",
    overrides: [
      { country_codes: ["GB"], unit_price: { amount: "3200", currency_code: "GBP" } },
      { country_codes: ["IE"], unit_price: { amount: "3600", currency_code: "EUR" } },
      { country_codes: ["AU"], unit_price: { amount: "5600", currency_code: "AUD" } },
      { country_codes: ["CO"], unit_price: { amount: "9900000", currency_code: "COP" } },
    ],
  },
  {
    plan: "Pro",
    cycle: "Annual",
    id: "pri_01kxk45w0918av1dw93a33knh8",
    overrides: [
      { country_codes: ["GB"], unit_price: { amount: "32000", currency_code: "GBP" } },
      { country_codes: ["IE"], unit_price: { amount: "36000", currency_code: "EUR" } },
      { country_codes: ["AU"], unit_price: { amount: "56000", currency_code: "AUD" } },
      { country_codes: ["CO"], unit_price: { amount: "99000000", currency_code: "COP" } },
    ],
  },
  {
    plan: "Advanced",
    cycle: "Monthly",
    id: "pri_01kxk45way6xk8rd51h6yt6v0t",
    overrides: [
      { country_codes: ["GB"], unit_price: { amount: "9500", currency_code: "GBP" } },
      { country_codes: ["IE"], unit_price: { amount: "10800", currency_code: "EUR" } },
      { country_codes: ["AU"], unit_price: { amount: "17000", currency_code: "AUD" } },
      { country_codes: ["CO"], unit_price: { amount: "29900000", currency_code: "COP" } },
    ],
  },
  {
    plan: "Advanced",
    cycle: "Annual",
    id: "pri_01kxk45wnbtdp8xw8r501sqpfs",
    overrides: [
      { country_codes: ["GB"], unit_price: { amount: "95000", currency_code: "GBP" } },
      { country_codes: ["IE"], unit_price: { amount: "108000", currency_code: "EUR" } },
      { country_codes: ["AU"], unit_price: { amount: "170000", currency_code: "AUD" } },
      { country_codes: ["CO"], unit_price: { amount: "299000000", currency_code: "COP" } },
    ],
  },
];

async function updatePrice(price) {
  const response = await fetch(`${PADDLE_API_BASE_URL}/prices/${price.id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${PADDLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      unit_price_overrides: price.overrides,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`${price.plan} ${price.cycle}: ${JSON.stringify(payload, null, 2)}`);
  }

  return {
    plan: price.plan,
    cycle: price.cycle,
    price_id: payload.data.id,
    unit_price_overrides: payload.data.unit_price_overrides,
  };
}

const updated = [];

for (const price of prices) {
  updated.push(await updatePrice(price));
}

console.log(JSON.stringify(updated, null, 2));
