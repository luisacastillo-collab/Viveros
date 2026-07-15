import "dotenv/config";
import cors from "cors";
import express from "express";
import { getPaddle } from "./paddle.mjs";
import { auth, db } from "./firestore.mjs";
import { processPaddleEvent } from "./webhook-handlers.mjs";
import { repairPaddleMirrorForUser } from "./paddle-repair.mjs";

const app = express();

function allowedOrigins() {
  return (process.env.FRONTEND_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins().includes(origin)) return callback(null, true);
      return callback(new Error(`Origin not allowed: ${origin}`));
    },
  }),
);

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.post("/api/paddle/webhook", express.raw({ type: "application/json" }), async (request, response) => {
  const signature = request.header("paddle-signature") || "";
  const secret = process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET || "";
  const rawBody = request.body?.toString("utf8") || "";

  if (!signature || !rawBody || !secret) {
    return response.status(400).json({ error: "Missing signature, body, or webhook secret." });
  }

  try {
    const paddle = getPaddle();
    const event = await paddle.webhooks.unmarshal(rawBody, secret, signature);
    const result = await processPaddleEvent(event);
    return response.json({ received: true, result });
  } catch (error) {
    console.error("Paddle webhook failed:", error);
    return response.status(500).json({ error: "Webhook failed." });
  }
});

app.use(express.json());

async function authenticateFirebaseUser(request, response, next) {
  const header = request.header("authorization") || "";
  const match = header.match(/^Bearer (.+)$/);

  if (!match) {
    return response.status(401).json({ error: "Not authenticated." });
  }

  try {
    request.user = await auth.verifyIdToken(match[1]);
    return next();
  } catch (error) {
    console.error("Firebase auth failed:", error);
    return response.status(401).json({ error: "Not authenticated." });
  }
}

function choosePrimarySubscription(subscriptions) {
  const priority = { active: 1, trialing: 2, past_due: 3, paused: 4, canceled: 5 };

  return subscriptions.sort((first, second) => {
    return (priority[first.status] || 99) - (priority[second.status] || 99);
  })[0] || null;
}

async function findPaddleCustomerByUser(user) {
  const byUid = await db
    .collection("paddleCustomers")
    .where("firebaseUid", "==", user.uid)
    .limit(1)
    .get();

  if (!byUid.empty) {
    return { customer: byUid.docs[0].data(), matchedBy: "firebaseUid" };
  }

  const subscriptionsByUid = await db
    .collection("paddleSubscriptions")
    .where("firebaseUid", "==", user.uid)
    .limit(1)
    .get();

  if (!subscriptionsByUid.empty) {
    const customerId = subscriptionsByUid.docs[0].data().customerId;
    if (customerId) {
      const customer = await db.collection("paddleCustomers").doc(customerId).get();
      return {
        customer: customer.exists ? customer.data() : { customerId, email: user.email },
        matchedBy: "subscriptionFirebaseUid",
      };
    }
  }

  const customers = await db
    .collection("paddleCustomers")
    .where("emailLower", "==", user.email.toLowerCase())
    .limit(1)
    .get();

  return customers.empty ? null : { customer: customers.docs[0].data(), matchedBy: "email" };
}

app.get("/api/paddle/subscription", authenticateFirebaseUser, async (request, response) => {
  const email = request.user.email;

  if (!email) {
    return response.status(400).json({ error: "Authenticated user has no email." });
  }

  let customerMatch = await findPaddleCustomerByUser(request.user);
  let repairResult = null;

  if (!customerMatch) {
    repairResult = await repairPaddleMirrorForUser(request.user);
    customerMatch = await findPaddleCustomerByUser(request.user);
  }

  if (!customerMatch) {
    return response.json({
      customer: null,
      subscription: null,
      diagnostic: {
        reason: "No customer matched Firebase uid or email.",
        firebaseUid: request.user.uid,
        firebaseEmail: email,
        repair: repairResult,
      },
    });
  }

  const { customer, matchedBy } = customerMatch;

  const subscriptionsSnapshot = await db
    .collection("paddleSubscriptions")
    .where("customerId", "==", customer.customerId)
    .get();

  const subscriptions = subscriptionsSnapshot.docs.map((doc) => doc.data());
  const subscription = choosePrimarySubscription(subscriptions);

  return response.json({
    customer: {
      customerId: customer.customerId,
      email: customer.email,
      matchedBy,
    },
    subscription: subscription
      ? {
          subscriptionId: subscription.subscriptionId,
          customerId: subscription.customerId,
          status: subscription.status,
          priceId: subscription.priceId,
          productId: subscription.productId,
          scheduledChangeAction: subscription.scheduledChangeAction || null,
          scheduledChangeAt: subscription.scheduledChangeAt || null,
        }
      : null,
    diagnostic: {
      firebaseUid: request.user.uid,
      firebaseEmail: email,
      matchedBy,
      subscriptionCount: subscriptions.length,
      repair: repairResult,
    },
  });
});

app.post("/api/paddle/customer-portal", authenticateFirebaseUser, async (request, response) => {
  const email = request.user.email;

  if (!email) {
    return response.status(400).json({ error: "Authenticated user has no email." });
  }

  const customerMatch = await findPaddleCustomerByUser(request.user);

  if (!customerMatch) {
    return response.status(404).json({
      error: "Todavia no encontramos una suscripcion de Paddle para este usuario. Primero completa una compra de prueba y verifica que el webhook llegue correctamente.",
    });
  }

  const { customer } = customerMatch;
  const customerId = customer.customerId;
  const subscriptions = await db
    .collection("paddleSubscriptions")
    .where("customerId", "==", customerId)
    .get();

  const subscriptionIds = subscriptions.docs.map((doc) => doc.data().subscriptionId).filter(Boolean);

  try {
    const session = await getPaddle().customerPortalSessions.create(customerId, subscriptionIds);
    return response.json({ url: session.urls.general.overview });
  } catch (error) {
    console.error("Customer portal session failed:", error);
    return response.status(500).json({ error: "No se pudo crear la sesion del portal de Paddle." });
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Paddle fulfillment server listening on port ${port}`);
});
