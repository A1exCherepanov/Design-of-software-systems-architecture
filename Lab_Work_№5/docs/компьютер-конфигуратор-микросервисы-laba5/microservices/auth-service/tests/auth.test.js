/**
 * Интеграционные тесты — auth-service
 *
 * Тестируют реальные HTTP-эндпоинты с настоящей PostgreSQL.
 * База данных указывается через переменные окружения:
 *   DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, DB_PORT
 *
 * Запуск:
 *   npm test
 */

import request from "supertest";
import app from "../app.js";
import pool from "../pool.js";

// Уникальный суффикс, чтобы тесты не конфликтовали при параллельном запуске
const RUN_ID = Date.now();
const TEST_USER = `testuser_${RUN_ID}`;
const TEST_PASS = "testpassword123";

// ─── Подготовка БД ─────────────────────────────────────────────────────────
beforeAll(async () => {
  // Создаём таблицу Users, если вдруг не существует
  await pool.query(`
    CREATE TABLE IF NOT EXISTS Users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL
    )
  `);
});

afterAll(async () => {
  // Убираем тестового пользователя и закрываем пул
  await pool.query(`DELETE FROM Users WHERE username = $1`, [TEST_USER]);
  await pool.end();
});

// ─── /health ───────────────────────────────────────────────────────────────
describe("GET /health", () => {
  it("возвращает статус ok", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("auth-service");
  });
});

// ─── /sign-up ──────────────────────────────────────────────────────────────
describe("POST /sign-up", () => {
  it("регистрирует нового пользователя и возвращает токен", async () => {
    const res = await request(app)
      .post("/sign-up")
      .send({ username: TEST_USER, password: TEST_PASS });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe(true);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.token.length).toBeGreaterThan(10);
  });

  it("отказывает при регистрации уже существующего пользователя", async () => {
    const res = await request(app)
      .post("/sign-up")
      .send({ username: TEST_USER, password: TEST_PASS });

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toMatch(/существует/i);
  });

  it("отказывает при слишком коротком имени (< 4 символов)", async () => {
    const res = await request(app)
      .post("/sign-up")
      .send({ username: "ab", password: "validpassword" });

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toMatch(/имени/i);
  });

  it("отказывает при слишком коротком пароле (< 8 символов)", async () => {
    const res = await request(app)
      .post("/sign-up")
      .send({ username: `newuser_${RUN_ID}`, password: "short" });

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toMatch(/пароля/i);
  });
});

// ─── /sign-in ──────────────────────────────────────────────────────────────
describe("POST /sign-in", () => {
  it("успешно входит с верными данными", async () => {
    const res = await request(app)
      .post("/sign-in")
      .send({ username: TEST_USER, password: TEST_PASS });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe(true);
    expect(typeof res.body.token).toBe("string");
  });

  it("отказывает при неверном пароле", async () => {
    const res = await request(app)
      .post("/sign-in")
      .send({ username: TEST_USER, password: "wrongpassword" });

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toMatch(/пароль/i);
  });

  it("отказывает при несуществующем пользователе", async () => {
    const res = await request(app)
      .post("/sign-in")
      .send({ username: "nobody_xyz_999", password: "somepass123" });

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toMatch(/не существует/i);
  });
});

// ─── /verify-token ─────────────────────────────────────────────────────────
describe("GET /verify-token", () => {
  let validToken;

  beforeAll(async () => {
    const res = await request(app)
      .post("/sign-in")
      .send({ username: TEST_USER, password: TEST_PASS });
    validToken = res.body.token;
  });

  it("возвращает 200 для валидного токена", async () => {
    const res = await request(app)
      .get("/verify-token")
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.statusCode).toBe(200);
  });

  it("возвращает 400 для невалидного токена", async () => {
    const res = await request(app)
      .get("/verify-token")
      .set("Authorization", "Bearer invalidtoken.abc.xyz");

    expect(res.statusCode).toBe(400);
  });

  it("возвращает 400 при отсутствии заголовка Authorization", async () => {
    const res = await request(app).get("/verify-token");
    expect(res.statusCode).toBe(400);
  });
});
