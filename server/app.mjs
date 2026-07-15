import "dotenv/config";
import cors from "cors";
import express from "express";
import { getPaddle } from "./paddle.mjs";
import { auth, db } from "./firestore.mjs";
import { processPaddleEvent } from "./webhook-handlers.mjs";

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

app.post("/api/paddle/customer-portal", authenticateFirebaseUser, async (request, response) => {
  const email = request.user.email;

  if (!email) {
    return response.status(400).json({ error: "Authenticated user has no email." });
  }

  const customers = await db
    .collection("paddleCustomers")
    .where("emailLower", "==", email.toLowerCase())
    .limit(1)
    .get();

  if (customers.empty) {
    return response.status(404).json({ error: "No Paddle customer. Subscribe first." });
  }

  const customerId = customers.docs[0].data().customerId;
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
    return response.status(500).json({ error: "Could not create customer portal session." });
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Paddle fulfillment server listening on port ${port}`);
});
