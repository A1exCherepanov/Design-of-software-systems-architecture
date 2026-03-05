import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const PORT = process.env.PORT || 3000;
const AUTH_SERVICE_URL     = process.env.AUTH_SERVICE_URL     || "http://localhost:3001";
const PRODUCTS_SERVICE_URL = process.env.PRODUCTS_SERVICE_URL || "http://localhost:3002";

const app = express();

// Разрешаем запросы с любого origin (нужно для Live Server)
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// ─── Вспомогательная функция пересылки запроса ─────────────────────────────
async function forwardRequest(req, res, targetBaseUrl) {
  const targetUrl = `${targetBaseUrl}${req.path}`;

  try {
    const headers = { "Content-Type": "application/json" };
    if (req.headers["authorization"]) {
      headers["authorization"] = req.headers["authorization"];
    }

    const fetchOptions = {
      method: req.method,
      headers,
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    res.status(response.status).json(data);
  } catch (err) {
    console.error(`❌ Ошибка пересылки на ${targetUrl}:`, err.message);
    res.status(502).json({ error: "Сервис недоступен", details: err.message });
  }
}

// ─── Health check ──────────────────────────────────────────────────────────
app.get("/health", (req, res) =>
  res.json({
    status: "ok",
    service: "api-gateway",
    routes: { auth: AUTH_SERVICE_URL, products: PRODUCTS_SERVICE_URL },
  })
);

// ─── Auth routes ───────────────────────────────────────────────────────────
app.post("/sign-in",       (req, res) => forwardRequest(req, res, AUTH_SERVICE_URL));
app.post("/sign-up",       (req, res) => forwardRequest(req, res, AUTH_SERVICE_URL));
app.get("/verify-token",   (req, res) => forwardRequest(req, res, AUTH_SERVICE_URL));

// ─── Products routes ───────────────────────────────────────────────────────
const productPaths = [
  "/cases", "/cases-json",
  "/graphics-cards", "/graphics-cards-json",
  "/memory", "/memory-json",
  "/motherboards", "/motherboards-json",
  "/power-supplies", "/power-supplies-json",
  "/processors", "/processors-json",
  "/storage", "/storage-json",
];

productPaths.forEach((path) => {
  app.get(path, (req, res) => forwardRequest(req, res, PRODUCTS_SERVICE_URL));
});

// ─── Запуск ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ api-gateway запущен на порту ${PORT}`);
  console.log(`   → Auth:     ${AUTH_SERVICE_URL}`);
  console.log(`   → Products: ${PRODUCTS_SERVICE_URL}`);
});

