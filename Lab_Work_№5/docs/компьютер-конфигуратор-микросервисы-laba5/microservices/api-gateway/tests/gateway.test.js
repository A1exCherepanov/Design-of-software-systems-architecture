/**
 * Интеграционные тесты — api-gateway
 *
 * Проверяют маршрутизацию запросов к auth-service и products-service.
 * Сервисы мокаются через nock / или тестируются через реальный HTTP
 * при наличии переменных AUTH_SERVICE_URL и PRODUCTS_SERVICE_URL.
 *
 * В CI эти тесты запускаются ПОСЛЕ запуска реальных сервисов.
 */

import request from "supertest";

// URL сервисов (CI поднимает их через docker-compose.test.yml)
const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:3000";

// ─── Вспомогательная функция ────────────────────────────────────────────────
async function get(path, headers = {}) {
  const res = await fetch(`${GATEWAY_URL}${path}`, { headers });
  return res;
}

async function post(path, body, headers = {}) {
  const res = await fetch(`${GATEWAY_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  return res;
}

// ─── Health ──────────────────────────────────────────────────────────────────
describe("GET /health", () => {
  it("gateway отвечает статусом ok", async () => {
    const res = await get("/health");
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.service).toBe("api-gateway");
    expect(body.status).toBe("ok");
  });
});

// ─── Маршрутизация auth-service ──────────────────────────────────────────────
describe("Маршрутизация → auth-service", () => {
  it("POST /sign-up проксируется и возвращает ответ от auth-service", async () => {
    const uniqueUser = `gwtest_${Date.now()}`;
    const res = await post("/sign-up", {
      username: uniqueUser,
      password: "validpassword123",
    });
    const body = await res.json();
    // Ожидаем либо успех, либо ошибку от auth-service (не 502 от gateway)
    expect([200, 400]).toContain(res.status);
    expect(body).toHaveProperty("status");
    expect(res.status).not.toBe(502);
  });

  it("POST /sign-in проксируется и возвращает 400 для несуществующего юзера", async () => {
    const res = await post("/sign-in", {
      username: "nonexistent_user_xyz",
      password: "password123",
    });
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.status).toBe(false);
  });

  it("GET /verify-token без токена возвращает 400", async () => {
    const res = await get("/verify-token");
    expect(res.status).toBe(400);
  });

  it("GET /verify-token с невалидным токеном возвращает 400", async () => {
    const res = await get("/verify-token", {
      Authorization: "Bearer this.is.not.valid",
    });
    expect(res.status).toBe(400);
  });
});

// ─── Маршрутизация products-service ─────────────────────────────────────────
describe("Маршрутизация → products-service", () => {
  const endpoints = [
    "/cases-json",
    "/graphics-cards-json",
    "/memory-json",
    "/motherboards-json",
    "/power-supplies-json",
    "/processors-json",
    "/storage-json",
  ];

  endpoints.forEach((endpoint) => {
    it(`GET ${endpoint} проксируется и возвращает массив`, async () => {
      const res = await get(endpoint);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
    });
  });

  it("GET /cases возвращает HTML строку с карточками товаров", async () => {
    const res = await get("/cases");
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(typeof body).toBe("string");
  });
});

// ─── Полный flow авторизации ──────────────────────────────────────────────────
describe("Полный flow: регистрация → вход → верификация токена", () => {
  const user = `flow_test_${Date.now()}`;
  const pass = "flowpassword123";
  let token;

  it("1. Регистрация нового пользователя", async () => {
    const res = await post("/sign-up", { username: user, password: pass });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe(true);
    token = body.token;
    expect(typeof token).toBe("string");
  });

  it("2. Вход под зарегистрированным пользователем", async () => {
    const res = await post("/sign-in", { username: user, password: pass });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe(true);
    token = body.token;
  });

  it("3. Верификация полученного токена", async () => {
    const res = await get("/verify-token", {
      Authorization: `Bearer ${token}`,
    });
    expect(res.status).toBe(200);
  });
});
