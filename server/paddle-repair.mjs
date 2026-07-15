import { db, serverTimestamp } from "./firestore.mjs";

function paddleApiBaseUrl() {
  if (process.env.PADDLE_ENV === "sandbox") {
    return "https://sandbox-api.paddle.com";
  }

  if (process.env.PADDLE_ENV === "production") {
    return "https://api.paddle.com";
  }

  throw new Error("PADDLE_ENV must be sandbox or production.");
}

async function paddleGet(path, params = {}) {
  const url = new URL(`${paddleApiBaseUrl()}${path}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
      Accept: "application/json",
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`Paddle API ${response.status}: ${JSON.stringify(payload)}`);
  }

  return payload.data || [];
}

function read(value, ...keys) {
  for (const key of keys) {
    if (value && value[key] !== undefined && value[key] !== null) {
      return value[key];
    }
  }
  return null;
}

function firstSubscriptionItem(subscription) {
  const items = read(subscription, "items") || [];
  return items[0] || {};
}

function subscriptionPrice(item) {
  return read(item, "price") || {};
}

function scheduledChange(subscription) {
  const change = read(subscription, "scheduledChange", "scheduled_change");
  return {
    action: read(change, "action"),
    effectiveAt: read(change, "effectiveAt", "effective_at"),
  };
}

async function findPaddleCustomer(email) {
  const customers = await paddleGet("/customers", { email });
  const emailLower = email.toLowerCase();

  return customers.find((customer) => read(customer, "email")?.toLowerCase() === emailLower) || null;
}

async function listPaddleSubscriptions(customerId) {
  return paddleGet("/subscriptions", { customer_id: customerId });
}

export async function repairPaddleMirrorForUser(user) {
  if (!process.env.PADDLE_API_KEY) {
    throw new Error("PADDLE_API_KEY is not set.");
  }

  if (!user.email) {
    throw new Error("Firebase user has no email.");
  }

  const customer = await findPaddleCustomer(user.email);

  if (!customer) {
    return {
      repaired: false,
      reason: "No Paddle customer found by email in Paddle API.",
      customer: null,
      subscriptions: [],
    };
  }

  const customerId = read(customer, "id");
  const email = read(customer, "email");
  const subscriptions = await listPaddleSubscriptions(customerId);

  await db.collection("paddleCustomers").doc(customerId).set(
    {
      customerId,
      email,
      emailLower: email.toLowerCase(),
      firebaseUid: user.uid,
      firebaseEmail: user.email,
      repairedFromPaddleApiAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  for (const subscription of subscriptions) {
    const item = firstSubscriptionItem(subscription);
    const price = subscriptionPrice(item);
    const change = scheduledChange(subscription);
    const subscriptionId = read(subscription, "id");

    if (!subscriptionId) continue;

    await db.collection("paddleSubscriptions").doc(subscriptionId).set(
      {
        subscriptionId,
        customerId,
        status: read(subscription, "status"),
        priceId: read(price, "id", "priceId", "price_id") || "",
        productId: read(price, "productId", "product_id") || "",
        firebaseUid: user.uid,
        firebaseEmail: user.email,
        scheduledChangeAction: change.action || null,
        scheduledChangeAt: change.effectiveAt || null,
        repairedFromPaddleApiAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  return {
    repaired: true,
    reason: "Mirrored Paddle customer and subscriptions from Paddle API.",
    customer: { customerId, email },
    subscriptions,
  };
}
