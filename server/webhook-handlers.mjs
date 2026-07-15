import { db, serverTimestamp } from "./firestore.mjs";

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

function scheduledChange(subscription) {
  const change = read(subscription, "scheduledChange", "scheduled_change");
  return {
    action: read(change, "action"),
    effectiveAt: read(change, "effectiveAt", "effective_at"),
  };
}

function subscriptionPrice(item) {
  return read(item, "price") || {};
}

async function markEventProcessed(transaction, eventId, eventType) {
  const eventRef = db.collection("paddleWebhookEvents").doc(eventId);
  const eventDoc = await transaction.get(eventRef);

  if (eventDoc.exists) {
    return false;
  }

  transaction.set(eventRef, {
    eventId,
    eventType,
    processedAt: serverTimestamp(),
  });

  return true;
}

export async function processPaddleEvent(event) {
  const eventType = read(event, "eventType", "event_type");
  const eventId = read(event, "eventId", "event_id", "id");

  if (!eventId) {
    throw new Error("Verified Paddle event is missing eventId.");
  }

  switch (eventType) {
    case "customer.created":
    case "customer.updated":
      return upsertCustomer(event);
    case "subscription.created":
    case "subscription.updated":
    case "subscription.canceled":
      return upsertSubscription(event);
    case "transaction.completed":
      return upsertTransaction(event);
    default:
      return { ignored: true, eventType };
  }
}

async function upsertCustomer(event) {
  const eventType = read(event, "eventType", "event_type");
  const eventId = read(event, "eventId", "event_id", "id");
  const customer = event.data;
  const customerId = read(customer, "id");
  const email = read(customer, "email");

  if (!customerId || !email) {
    throw new Error("Customer event missing id or email.");
  }

  await db.runTransaction(async (transaction) => {
    const fresh = await markEventProcessed(transaction, eventId, eventType);
    if (!fresh) return;

    transaction.set(
      db.collection("paddleCustomers").doc(customerId),
      {
        customerId,
        email,
        emailLower: email.toLowerCase(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  });

  return { handled: eventType, customerId };
}

async function upsertSubscription(event) {
  const eventType = read(event, "eventType", "event_type");
  const eventId = read(event, "eventId", "event_id", "id");
  const subscription = event.data;
  const item = firstSubscriptionItem(subscription);
  const price = subscriptionPrice(item);
  const change = scheduledChange(subscription);
  const subscriptionId = read(subscription, "id");
  const customerId = read(subscription, "customerId", "customer_id");
  const priceId = read(price, "id", "priceId", "price_id");
  const productId = read(price, "productId", "product_id");

  if (!subscriptionId || !customerId) {
    throw new Error("Subscription event missing subscription id or customer id.");
  }

  await db.runTransaction(async (transaction) => {
    const fresh = await markEventProcessed(transaction, eventId, eventType);
    if (!fresh) return;

    transaction.set(
      db.collection("paddleSubscriptions").doc(subscriptionId),
      {
        subscriptionId,
        customerId,
        status: read(subscription, "status"),
        priceId: priceId || "",
        productId: productId || "",
        scheduledChangeAction: change.action || null,
        scheduledChangeAt: change.effectiveAt || null,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  });

  return { handled: eventType, subscriptionId };
}

async function upsertTransaction(event) {
  const eventType = read(event, "eventType", "event_type");
  const eventId = read(event, "eventId", "event_id", "id");
  const paddleTransaction = event.data;
  const transactionId = read(paddleTransaction, "id");

  if (!transactionId) {
    throw new Error("Transaction event missing transaction id.");
  }

  await db.runTransaction(async (transaction) => {
    const fresh = await markEventProcessed(transaction, eventId, eventType);
    if (!fresh) return;

    transaction.set(
      db.collection("paddleTransactions").doc(transactionId),
      {
        transactionId,
        customerId: read(paddleTransaction, "customerId", "customer_id") || null,
        subscriptionId: read(paddleTransaction, "subscriptionId", "subscription_id") || null,
        status: read(paddleTransaction, "status") || null,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  });

  return { handled: eventType, transactionId };
}
