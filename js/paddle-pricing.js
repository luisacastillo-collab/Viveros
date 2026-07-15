import { auth, onAuthStateChanged } from "../firebase-config.js";

const tiers = [
  {
    name: "Starter",
    description: "Para viveros que quieren empezar a recibir clientes desde internet.",
    features: ["Perfil en el directorio", "Catalogo basico de plantas", "Prueba gratis de 7 dias"],
    priceId: {
      month: "pri_01kxk45vaw7e6x1ytzwhc44prz",
      year: "pri_01kxk45vgxnrcjxj989dhf4rc3",
    },
  },
  {
    name: "Pro",
    description: "Para viveros que quieren administrar mejor su catalogo y presencia online.",
    features: ["Todo lo de Starter", "Catalogo destacado", "Mejor visibilidad en busquedas"],
    priceId: {
      month: "pri_01kxk45vvkwx8wec3aw5brp9jj",
      year: "pri_01kxk45w0918av1dw93a33knh8",
    },
  },
  {
    name: "Advanced",
    description: "Para viveros con operacion grande y mayor necesidad comercial.",
    features: ["Todo lo de Pro", "Prioridad en el directorio", "Soporte para crecimiento"],
    priceId: {
      month: "pri_01kxk45way6xk8rd51h6yt6v0t",
      year: "pri_01kxk45wnbtdp8xw8r501sqpfs",
    },
  },
];

let billingCycle = "month";
let currentUser = null;
let priceMap = {};
let paddleReady = false;
let authReady = false;

const statusEl = document.getElementById("paddle-status");
const toggleButtons = [...document.querySelectorAll("[data-billing-toggle]")];
const cards = [...document.querySelectorAll("[data-tier-card]")];

function fail(message) {
  statusEl.textContent = message;
  statusEl.classList.remove("text-muted");
  statusEl.classList.add("text-danger");
  document.querySelectorAll("[data-subscribe]").forEach((button) => {
    button.disabled = true;
  });
}

function getPaddleConfig() {
  const config = window.VIVEROS_PADDLE_CONFIG;

  if (!config?.environment) {
    throw new Error("Falta PADDLE_ENV. Configura environment en paddle-config.js.");
  }

  if (!config?.clientToken) {
    throw new Error("Falta PADDLE_CLIENT_TOKEN. Configura clientToken en paddle-config.js.");
  }

  if (config.environment !== "sandbox" && config.environment !== "production") {
    throw new Error("PADDLE_ENV debe ser sandbox o production.");
  }

  if (config.environment === "sandbox" && !config.clientToken.startsWith("test_")) {
    throw new Error("El token de sandbox debe empezar con test_.");
  }

  return config;
}

function getSuccessUrl() {
  return new URL("welcome/", window.location.href).href;
}

function renderPrices() {
  cards.forEach((card) => {
    const tier = tiers.find((item) => item.name === card.dataset.tierCard);
    const priceId = tier.priceId[billingCycle];
    const priceEl = card.querySelector("[data-price]");
    const intervalEl = card.querySelector("[data-interval]");
    const button = card.querySelector("[data-subscribe]");

    priceEl.textContent = priceMap[priceId] || "...";
    intervalEl.textContent = billingCycle === "month" ? "/mes" : "/ano";
    button.dataset.priceId = priceId;
    button.disabled = !paddleReady || !authReady || !currentUser || !priceMap[priceId];
  });
}

async function loadPricePreview() {
  const items = tiers.flatMap((tier) => [
    { priceId: tier.priceId.month, quantity: 1 },
    { priceId: tier.priceId.year, quantity: 1 },
  ]);

  const preview = await window.Paddle.PricePreview({ items });
  priceMap = preview.data.details.lineItems.reduce((acc, item) => {
    acc[item.price.id] = item.formattedTotals.total;
    return acc;
  }, {});

  statusEl.textContent = "Precios localizados por Paddle segun tu ubicacion.";
  statusEl.classList.remove("text-danger");
  statusEl.classList.add("text-muted");
  renderPrices();
}

function openCheckout(priceId) {
  if (!currentUser?.uid || !currentUser?.email) {
    window.location.href = "login.html";
    return;
  }

  const checkout = {
    items: [{ priceId, quantity: 1 }],
    settings: {
      displayMode: "overlay",
      variant: "one-page",
      successUrl: getSuccessUrl(),
    },
  };

  checkout.customer = { email: currentUser.email };
  checkout.customData = {
    firebaseUid: currentUser.uid,
    firebaseEmail: currentUser.email,
  };

  window.Paddle.Checkout.open(checkout);
}

function attachEvents() {
  toggleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      billingCycle = button.dataset.billingToggle;
      toggleButtons.forEach((item) => item.classList.toggle("active", item === button));
      renderPrices();
    });
  });

  document.querySelectorAll("[data-subscribe]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.priceId) openCheckout(button.dataset.priceId);
    });
  });
}

async function initPaddlePricing() {
  try {
    const config = getPaddleConfig();

    if (!window.Paddle) {
      throw new Error("Paddle.js no cargo. Revisa tu conexion o el script de cdn.paddle.com.");
    }

    window.Paddle.Environment.set(config.environment);
    window.Paddle.Initialize({
      token: config.clientToken,
      eventCallback: (event) => {
        if (event.name === "checkout.completed") {
          window.location.href = getSuccessUrl();
        }
      },
    });

    paddleReady = true;
    await loadPricePreview();
  } catch (error) {
    fail(error.message);
  }
}

onAuthStateChanged(auth, (user) => {
  authReady = true;
  currentUser = user;
  if (!user) {
    statusEl.textContent = "Inicia sesion para suscribirte.";
  }
  renderPrices();
});

attachEvents();
renderPrices();
initPaddlePricing();
