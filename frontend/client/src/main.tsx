// import { createRoot } from "react-dom/client";
// import App from "./App";
// import "./index.css";

// createRoot(document.getElementById("root")!).render(<App />);


import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { logger } from "./lib/logger";

if (import.meta.env.PROD) {
  for (const method of ['log', 'debug', 'info', 'warn', 'error'] as const) {
    Object.defineProperty(globalThis.console, method, {
      value: () => {},
      writable: false,
      configurable: true,
    });
  }
}

window.addEventListener('error', (event) => {
  logger.error('Erreur globale navigateur', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  logger.error('Promesse rejetée non gérée', event.reason);
});

// ✅ Ajout d'un gestionnaire d'erreurs global

const rootElement = document.getElementById("root");
if (!rootElement) {
  logger.error('Élément root introuvable');
} else {
  try {
    createRoot(rootElement).render(<App />);
  } catch (error) {
    logger.error('Erreur lors du montage de l\'application', error);
    rootElement.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:1rem;font-family:sans-serif;padding:2rem;text-align:center;">
        <div style="font-size:3rem;">⚠️</div>
        <h1 style="color:#1e293b;">Erreur de chargement</h1>
        <p style="color:#64748b;max-width:400px;">Une erreur est survenue lors du chargement de l'application.</p>
        <button onclick="window.location.reload()" style="padding:0.75rem 2rem;background:#4f46e5;color:white;border:none;border-radius:12px;font-weight:bold;cursor:pointer;">
          Recharger
        </button>
      </div>
    `;
  }
}
