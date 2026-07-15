import { auth, onAuthStateChanged } from "../firebase-config.js";

const statusEl = document.getElementById("billing-status");
const portalButton = document.getElementById("open-portal");

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("text-danger", isError);
  statusEl.classList.toggle("text-muted", !isError);
}

function getApiBaseUrl() {
  const apiBaseUrl = window.VIVEROS_PADDLE_CONFIG?.apiBaseUrl;

  if (!apiBaseUrl) {
    throw new Error("Falta apiBaseUrl en paddle-config.js. Despliega el backend y configura su URL.");
  }

  return apiBaseUrl.replace(/\/$/, "");
}

async function openPortal(user) {
  portalButton.disabled = true;
  setStatus("Creando sesion segura del portal...");

  try {
    const token = await user.getIdToken();
    const response = await fetch(`${getApiBaseUrl()}/api/paddle/customer-portal`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const payload = await response.json();

    if (!response.ok || !payload.url) {
      throw new Error(payload.error || "No se pudo abrir el portal.");
    }

    window.location.href = payload.url;
  } catch (error) {
    portalButton.disabled = false;
    setStatus(error.message, true);
  }
}

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  portalButton.disabled = false;
  setStatus(`Sesion iniciada como ${user.email}.`);
  portalButton.addEventListener("click", () => openPortal(user));
});
