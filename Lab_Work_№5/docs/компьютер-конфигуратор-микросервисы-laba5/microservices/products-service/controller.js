import pool from "./pool.js";

// Генератор HTML-карточки товара
function buildProductHTML(product, category, fields) {
  const fieldsHTML = fields
    .map(([label, key]) => `<p class="products_item_text">${label}: ${product[key]}</p>`)
    .join("\n");

  return `
    <div class="products_item" id="${category}_${product.id}" price="${product.price}">
        <img src="${product.image_url}" alt="${product.name}">
        <p class="products_item_title">${product.name}</p>
        <p class="products_item_text">Магазин: ${product.store_name}</p>
        ${fieldsHTML}
        <div class="products_item_wrap">
          <p class="products_item_price">${product.price} руб.</p>
          <a class="products_item_link" href="${product.product_url}" target="_blank">На сайт</a>
        </div>
    </div>`;
}

class ProductsController {
  // ─── Cases ────────────────────────────────────────────────────────────────
  async getCases(req, res) {
    try {
      const { rows } = await pool.query(`SELECT * FROM Cases`);
      const html = rows.map((p) =>
        buildProductHTML(p, "Cases", [
          ["Гарантия", "warranty"],
          ["Вес", "weight"],
          ["Материал", "material"],
        ])
      ).join("");
      res.json(html);
    } catch (e) { res.status(500).json({ error: e.message }); }
  }

  async getCasesJSON(req, res) {
    try {
      const { rows } = await pool.query(`SELECT * FROM Cases`);
      res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  }

  // ─── Graphics Cards ───────────────────────────────────────────────────────
  async getGraphicsCards(req, res) {
    try {
      const { rows } = await pool.query(`SELECT * FROM GraphicsCards`);
      const html = rows.map((p) =>
        buildProductHTML(p, "GraphicsCards", [
          ["Гарантия", "warranty"],
          ["Объём памяти", "memory_size"],
          ["Тип памяти", "memory_type"],
          ["GPU clock", "gpu_clock"],
        ])
      ).join("");
      res.json(html);
    } catch (e) { res.status(500).json({ error: e.message }); }
  }

  async getGraphicsCardsJSON(req, res) {
    try {
      const { rows } = await pool.query(`SELECT * FROM GraphicsCards`);
      res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  }

  // ─── Memory ───────────────────────────────────────────────────────────────
  async getMemory(req, res) {
    try {
      const { rows } = await pool.query(`SELECT * FROM Memory`);
      const html = rows.map((p) =>
        buildProductHTML(p, "Memory", [
          ["Гарантия", "warranty"],
          ["Страна производства", "country_of_origin"],
          ["Ёмкость", "module_capacity"],
          ["Общая ёмкость", "total_capacity"],
          ["Частота памяти", "memory_frequency"],
          ["Тип памяти", "memory_type"],
          ["Объём памяти", "modules_in_kit"],
        ])
      ).join("");
      res.json(html);
    } catch (e) { res.status(500).json({ error: e.message }); }
  }

  async getMemoryJSON(req, res) {
    try {
      const { rows } = await pool.query(`SELECT * FROM Memory`);
      res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  }

  // ─── Motherboards ─────────────────────────────────────────────────────────
  async getMotherboards(req, res) {
    try {
      const { rows } = await pool.query(`SELECT * FROM Motherboards`);
      const html = rows.map((p) =>
        buildProductHTML(p, "Motherboards", [
          ["Разъём", "socket"],
          ["Страна производства", "country_of_origin"],
          ["Чипсет", "chipset"],
          ["Тип памяти", "memory_type"],
          ["Ячейки памяти", "memory_slots"],
        ])
      ).join("");
      res.json(html);
    } catch (e) { res.status(500).json({ error: e.message }); }
  }

  async getMotherboardsJSON(req, res) {
    try {
      const { rows } = await pool.query(`SELECT * FROM Motherboards`);
      res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  }

  // ─── Power Supplies ───────────────────────────────────────────────────────
  async getPowerSupplies(req, res) {
    try {
      const { rows } = await pool.query(`SELECT * FROM PowerSupplies`);
      const html = rows.map((p) =>
        buildProductHTML(p, "PowerSupplies", [
          ["Гарантия", "warranty"],
          ["Страна производства", "country_of_origin"],
          ["Модель", "model"],
          ["Мощность", "power"],
          ["Длина", "length"],
          ["Ширина", "width"],
          ["Высота", "height"],
        ])
      ).join("");
      res.json(html);
    } catch (e) { res.status(500).json({ error: e.message }); }
  }

  async getPowerSuppliesJSON(req, res) {
    try {
      const { rows } = await pool.query(`SELECT * FROM PowerSupplies`);
      res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  }

  // ─── Processors ───────────────────────────────────────────────────────────
  async getProcessors(req, res) {
    try {
      const { rows } = await pool.query(`SELECT * FROM Processors`);
      const html = rows.map((p) =>
        buildProductHTML(p, "Processors", [
          ["Гарантия", "warranty"],
          ["Разъём", "socket"],
          ["Ядра", "cores"],
          ["Потоки", "threads"],
          ["Базовая частота", "base_clock"],
          ["Повышенная частота", "turbo_clock"],
          ["TDP", "tdp"],
        ])
      ).join("");
      res.json(html);
    } catch (e) { res.status(500).json({ error: e.message }); }
  }

  async getProcessorsJSON(req, res) {
    try {
      const { rows } = await pool.query(`SELECT * FROM Processors`);
      res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  }

  // ─── Storage ──────────────────────────────────────────────────────────────
  async getStorage(req, res) {
    try {
      const { rows } = await pool.query(`SELECT * FROM Storage`);
      const html = rows.map((p) =>
        buildProductHTML(p, "Storage", [
          ["Гарантия", "warranty"],
          ["Емкость", "capacity"],
          ["Макс. скорость чтения", "max_read_speed"],
          ["Макс. скорость записи", "max_write_speed"],
        ])
      ).join("");
      res.json(html);
    } catch (e) { res.status(500).json({ error: e.message }); }
  }

  async getStorageJSON(req, res) {
    try {
      const { rows } = await pool.query(`SELECT * FROM Storage`);
      res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  }
}

export default new ProductsController();
