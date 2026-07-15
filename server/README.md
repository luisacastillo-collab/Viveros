# Paddle Fulfillment Server

This backend is required because GitHub Pages cannot receive Paddle webhooks or keep server-side secrets.

## Environment

Set these on your hosting provider:

```bash
PADDLE_ENV=sandbox
PADDLE_API_KEY=pdl_sdbx_apikey_...
PADDLE_NOTIFICATION_WEBHOOK_SECRET=pdl_ntfset_...
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
FRONTEND_ORIGINS=http://localhost:8000,https://luisacastillo-collab.github.io
PORT=3000
```

Never put `PADDLE_API_KEY`, `PADDLE_NOTIFICATION_WEBHOOK_SECRET`, or Firebase service account JSON in browser code.

## Paddle notification destination

There is no Paddle MCP server connected in this Codex session, so create the destination manually:

1. Open Paddle Sandbox.
2. Go to Developer tools > Notifications.
3. Create a new webhook destination.
4. URL: `https://YOUR_BACKEND_DOMAIN/api/paddle/webhook`.
5. Subscribe to:
   - `transaction.completed`
   - `subscription.created`
   - `subscription.updated`
   - `subscription.canceled`
   - `customer.created`
   - `customer.updated`
6. Copy the signing secret into `PADDLE_NOTIFICATION_WEBHOOK_SECRET`.

Do not delete this notification destination, products, prices, customers, subscriptions, transactions, or mirrored database rows. They are permanent fulfillment infrastructure.

## Local run

```bash
npm install
npm run server
```

Use a tunnel such as ngrok or cloudflared for webhook testing:

```bash
ngrok http 3000
```

Then use the HTTPS tunnel URL as the Paddle notification destination.
