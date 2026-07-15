const PADDLE_API_KEY = process.env.PADDLE_API_KEY;
const PADDLE_API_BASE_URL = process.env.PADDLE_API_BASE_URL || "https://sandbox-api.paddle.com";

if (!PADDLE_API_KEY) {
  console.error("Missing PADDLE_API_KEY. Create a sandbox API key in Paddle > Developer tools > Authentication.");
  process.exit(1);
}

if (!PADDLE_API_KEY.includes("_sdbx") && process.env.ALLOW_NON_SANDBOX !== "true") {
  console.error("This script is intended for Paddle Sandbox. Your API key does not look like a sandbox key.");
  console.error("Sandbox API keys usually contain '_sdbx'. Set ALLOW_NON_SANDBOX=true only if you know what you are doing.");
  process.exit(1);
}

const plans = [
  {
    name: "Starter",
    description: "Starter plan for ViveroOnline.",
    prices: [
      {
        name: "Monthly",
        description: "Starter monthly USD with 7-day free trial",
        amount: "1000",
        interval: "month",
        overrides: [
          { country_codes: ["GB"], unit_price: { amount: "800", currency_code: "GBP" } },
          { country_codes: ["IE"], unit_price: { amount: "900", currency_code: "EUR" } },
          { country_codes: ["AU"], unit_price: { amount: "1400", currency_code: "AUD" } },
        ],
      },
      {
        name: "Annual",
        description: "Starter annual USD with 7-day free trial",
        amount: "10000",
        interval: "year",
        overrides: [
          { country_codes: ["GB"], unit_price: { amount: "8000", currency_code: "GBP" } },
          { country_codes: ["IE"], unit_price: { amount: "9000", currency_code: "EUR" } },
          { country_codes: ["AU"], unit_price: { amount: "14000", currency_code: "AUD" } },
        ],
      },
    ],
  },
  {
    name: "Pro",
    description: "Pro plan for ViveroOnline.",
    prices: [
      {
        name: "Monthly",
        description: "Pro monthly USD with 7-day free trial",
        amount: "4000",
        interval: "month",
        overrides: [
          { country_codes: ["GB"], unit_price: { amount: "3200", currency_code: "GBP" } },
          { country_codes: ["IE"], unit_price: { amount: "3600", currency_code: "EUR" } },
          { country_codes: ["AU"], unit_price: { amount: "5600", currency_code: "AUD" } },
        ],
      },
      {
        name: "Annual",
        description: "Pro annual USD with 7-day free trial",
        amount: "40000",
        interval: "year",
        overrides: [
          { country_codes: ["GB"], unit_price: { amount: "32000", currency_code: "GBP" } },
          { country_codes: ["IE"], unit_price: { amount: "36000", currency_code: "EUR" } },
          { country_codes: ["AU"], unit_price: { amount: "56000", currency_code: "AUD" } },
        ],
      },
    ],
  },
  {
    name: "Advanced",
    description: "Advanced plan for ViveroOnline.",
    prices: [
      {
        name: "Monthly",
        description: "Advanced monthly USD with 7-day free trial",
        amount: "12000",
        interval: "month",
        overrides: [
          { country_codes: ["GB"], unit_price: { amount: "9500", currency_code: "GBP" } },
          { country_codes: ["IE"], unit_price: { amount: "10800", currency_code: "EUR" } },
          { country_codes: ["AU"], unit_price: { amount: "17000", currency_code: "AUD" } },
        ],
      },
      {
        name: "Annual",
        description: "Advanced annual USD with 7-day free trial",
        amount: "120000",
        interval: "year",
        overrides: [
          { country_codes: ["GB"], unit_price: { amount: "95000", currency_code: "GBP" } },
          { country_codes: ["IE"], unit_price: { amount: "108000", currency_code: "EUR" } },
          { country_codes: ["AU"], unit_price: { amount: "170000", currency_code: "AUD" } },
        ],
      },
    ],
  },
];

async function paddleRequest(path, body) {
  const response = await fetch(`${PADDLE_API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PADDLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error(`Paddle API error while calling ${path}:`);
    console.error(JSON.stringify(payload, null, 2));
    process.exit(1);
  }

  return payload.data;
}

async function createCatalog() {
  const created = [];

  for (const plan of plans) {
    const product = await paddleRequest("/products", {
      name: plan.name,
      description: plan.description,
      tax_category: "saas",
    });

    const prices = [];

    for (const price of plan.prices) {
      const createdPrice = await paddleRequest("/prices", {
        product_id: product.id,
        name: price.name,
        description: price.description,
        unit_price: { amount: price.amount, currency_code: "USD" },
        unit_price_overrides: price.overrides,
        billing_cycle: { interval: price.interval, frequency: 1 },
        trial_period: {
          interval: "day",
          frequency: 7,
          requires_payment_method: true,
          unit_price: null,
        },
        tax_mode: "account_setting",
      });

      prices.push({
        name: price.name,
        id: createdPrice.id,
        billing_cycle: createdPrice.billing_cycle,
        unit_price: createdPrice.unit_price,
        unit_price_overrides: createdPrice.unit_price_overrides,
        trial_period: createdPrice.trial_period,
      });
    }

    created.push({
      name: plan.name,
      product_id: product.id,
      tax_category: product.tax_category,
      prices,
    });
  }

  console.log(JSON.stringify(created, null, 2));
}

createCatalog().catch((error) => {
  console.error(error);
  process.exit(1);
});
