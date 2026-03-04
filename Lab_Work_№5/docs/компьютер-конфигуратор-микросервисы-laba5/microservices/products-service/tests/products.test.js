/**
 * Интеграционные тесты — products-service
 *
 * Перед запуском тестов в БД вставляются тестовые данные,
 * после — удаляются. Тесты проверяют реальные SQL-запросы.
 *
 * Запуск:
 *   npm test
 */

import request from "supertest";
import app from "../app.js";
import pool from "../pool.js";

// ─── Seed-данные ────────────────────────────────────────────────────────────
const SEED = {
  cases: {
    table: "Cases",
    insert: `INSERT INTO Cases (name, warranty, weight, material, price, product_url, image_url, store_name)
             VALUES ('Test Case', '1 год', '5 кг', 'Сталь', 5000,
                    'https://example.com', 'https://example.com/img.jpg', 'TestShop')`,
    cleanup: `DELETE FROM Cases WHERE store_name = 'TestShop'`,
  },
  processors: {
    table: "Processors",
    insert: `INSERT INTO Processors (name, cores, threads, socket, warranty, base_clock, turbo_clock, tdp, price, product_url, image_url, store_name)
             VALUES ('Test CPU', '8', '16', 'AM5', '3 года', '3.5 GHz', '5.0 GHz', '65W', 20000,
                    'https://example.com', 'https://example.com/img.jpg', 'TestShop')`,
    cleanup: `DELETE FROM Processors WHERE store_name = 'TestShop'`,
  },
  graphics_cards: {
    table: "GraphicsCards",
    insert: `INSERT INTO GraphicsCards (name, warranty, memory_size, memory_type, gpu_clock, price, product_url, image_url, store_name)
             VALUES ('Test GPU', '2 года', '8 GB', 'GDDR6', '1800 MHz', 30000,
                    'https://example.com', 'https://example.com/img.jpg', 'TestShop')`,
    cleanup: `DELETE FROM GraphicsCards WHERE store_name = 'TestShop'`,
  },
  memory: {
    table: "Memory",
    insert: `INSERT INTO Memory (name, warranty, country_of_origin, module_capacity, total_capacity, memory_frequency, memory_type, modules_in_kit, price, product_url, image_url, store_name)
             VALUES ('Test RAM', '3 года', 'Тайвань', '8 GB', '16 GB', '3200 MHz', 'DDR4', '2', 5000,
                    'https://example.com', 'https://example.com/img.jpg', 'TestShop')`,
    cleanup: `DELETE FROM Memory WHERE store_name = 'TestShop'`,
  },
  motherboards: {
    table: "Motherboards",
    insert: `INSERT INTO Motherboards (name, socket, chipset, memory_type, memory_slots, country_of_origin, price, product_url, image_url, store_name)
             VALUES ('Test MB', 'AM5', 'X670', 'DDR5', '4', 'Тайвань', 15000,
                    'https://example.com', 'https://example.com/img.jpg', 'TestShop')`,
    cleanup: `DELETE FROM Motherboards WHERE store_name = 'TestShop'`,
  },
  power_supplies: {
    table: "PowerSupplies",
    insert: `INSERT INTO PowerSupplies (name, warranty, country_of_origin, model, power, length, width, height, price, product_url, image_url, store_name)
             VALUES ('Test PSU', '5 лет', 'Тайвань', 'Test-750', '750W', '140 мм', '150 мм', '86 мм', 8000,
                    'https://example.com', 'https://example.com/img.jpg', 'TestShop')`,
    cleanup: `DELETE FROM PowerSupplies WHERE store_name = 'TestShop'`,
  },
  storage: {
    table: "Storage",
    insert: `INSERT INTO Storage (name, warranty, capacity, max_read_speed, max_write_speed, price, product_url, image_url, store_name)
             VALUES ('Test SSD', '5 лет', '1 TB', '7000 МБ/с', '6500 МБ/с', 10000,
                    'https://example.com', 'https://example.com/img.jpg', 'TestShop')`,
    cleanup: `DELETE FROM Storage WHERE store_name = 'TestShop'`,
  },
};

beforeAll(async () => {
  // Создаём все таблицы (на случай чистой тестовой БД)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS Cases (
      id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, warranty VARCHAR(255) NOT NULL,
      weight VARCHAR(255) NOT NULL, material VARCHAR(255) NOT NULL, price INTEGER NOT NULL,
      product_url VARCHAR(255) NOT NULL, image_url VARCHAR(255) NOT NULL, store_name VARCHAR(255) NOT NULL
    )`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS Processors (
      id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, cores VARCHAR(255) NOT NULL,
      threads VARCHAR(255) NOT NULL, socket VARCHAR(255) NOT NULL, warranty VARCHAR(255) NOT NULL,
      base_clock VARCHAR(255) NOT NULL, turbo_clock VARCHAR(255) NOT NULL, tdp VARCHAR(255) NOT NULL,
      price INTEGER NOT NULL, product_url VARCHAR(255) NOT NULL, image_url VARCHAR(255) NOT NULL,
      store_name VARCHAR(255) NOT NULL
    )`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS GraphicsCards (
      id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, warranty VARCHAR(255) NOT NULL,
      memory_size VARCHAR(255) NOT NULL, memory_type VARCHAR(255) NOT NULL, gpu_clock VARCHAR(255) NOT NULL,
      price INTEGER NOT NULL, product_url VARCHAR(255) NOT NULL, image_url VARCHAR(255) NOT NULL,
      store_name VARCHAR(255) NOT NULL
    )`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS Memory (
      id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, warranty VARCHAR(255) NOT NULL,
      country_of_origin VARCHAR(255) NOT NULL, module_capacity VARCHAR(255) NOT NULL,
      total_capacity VARCHAR(255) NOT NULL, memory_frequency VARCHAR(255) NOT NULL,
      memory_type VARCHAR(255) NOT NULL, modules_in_kit VARCHAR(255) NOT NULL,
      price INTEGER NOT NULL, product_url VARCHAR(255) NOT NULL, image_url VARCHAR(255) NOT NULL,
      store_name VARCHAR(255) NOT NULL
    )`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS Motherboards (
      id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, socket VARCHAR(255) NOT NULL,
      chipset VARCHAR(255) NOT NULL, memory_type VARCHAR(255) NOT NULL, memory_slots VARCHAR(255) NOT NULL,
      country_of_origin VARCHAR(255) NOT NULL, price INTEGER NOT NULL,
      product_url VARCHAR(255) NOT NULL, image_url VARCHAR(255) NOT NULL, store_name VARCHAR(255) NOT NULL
    )`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS PowerSupplies (
      id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, warranty VARCHAR(255) NOT NULL,
      country_of_origin VARCHAR(255) NOT NULL, model VARCHAR(255) NOT NULL, power VARCHAR(255) NOT NULL,
      length VARCHAR(255) NOT NULL, width VARCHAR(255) NOT NULL, height VARCHAR(255) NOT NULL,
      price INTEGER NOT NULL, product_url VARCHAR(255) NOT NULL, image_url VARCHAR(255) NOT NULL,
      store_name VARCHAR(255) NOT NULL
    )`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS Storage (
      id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, warranty VARCHAR(255) NOT NULL,
      capacity VARCHAR(255) NOT NULL, max_read_speed VARCHAR(255) NOT NULL,
      max_write_speed VARCHAR(255) NOT NULL, price INTEGER NOT NULL,
      product_url VARCHAR(255) NOT NULL, image_url VARCHAR(255) NOT NULL, store_name VARCHAR(255) NOT NULL
    )`);

  // Вставляем тестовые данные
  for (const seed of Object.values(SEED)) {
    await pool.query(seed.insert);
  }
});

afterAll(async () => {
  for (const seed of Object.values(SEED)) {
    await pool.query(seed.cleanup);
  }
  await pool.end();
});

// ─── Хелпер для повторяющихся проверок ─────────────────────────────────────
function testCategory(htmlPath, jsonPath, expectedHtmlFragment) {
  describe(`GET ${htmlPath}`, () => {
    it("возвращает HTML-строку со списком товаров", async () => {
      const res = await request(app).get(htmlPath);
      expect(res.statusCode).toBe(200);
      expect(typeof res.body).toBe("string");
      expect(res.body).toContain(expectedHtmlFragment);
      expect(res.body).toContain("products_item");
    });
  });

  describe(`GET ${jsonPath}`, () => {
    it("возвращает непустой массив JSON", async () => {
      const res = await request(app).get(jsonPath);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it("каждый элемент содержит обязательные поля", async () => {
      const res = await request(app).get(jsonPath);
      const item = res.body[0];
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("name");
      expect(item).toHaveProperty("price");
      expect(item).toHaveProperty("store_name");
    });
  });
}

// ─── Health ─────────────────────────────────────────────────────────────────
describe("GET /health", () => {
  it("возвращает статус ok", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

// ─── Категории товаров ───────────────────────────────────────────────────────
testCategory("/cases",          "/cases-json",          "Test Case");
testCategory("/graphics-cards", "/graphics-cards-json", "Test GPU");
testCategory("/memory",         "/memory-json",         "Test RAM");
testCategory("/motherboards",   "/motherboards-json",   "Test MB");
testCategory("/power-supplies", "/power-supplies-json", "Test PSU");
testCategory("/processors",     "/processors-json",     "Test CPU");
testCategory("/storage",        "/storage-json",        "Test SSD");
