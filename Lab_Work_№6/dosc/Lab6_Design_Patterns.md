# Лабораторная работа №6

**Тема:** Использование шаблонов проектирования

**Цель работы:** Получить опыт применения шаблонов проектирования при написании кода программной системы.

**Проект:** Конфигуратор компьютерной сборки - микросервисное веб-приложение для подбора комплектующих (процессоры, видеокарты, материнские платы, память, накопители, блоки питания, корпуса) с авторизацией пользователей и корзиной. Реализован на Node.js с тремя микросервисами: `auth-service`, `products-service`, `api-gateway`.

---

# Шаблоны проектирования GoF

## Порождающие шаблоны

---

### 1. Singleton (Одиночка)

**Общее назначение:** Гарантирует, что класс имеет только один экземпляр, и предоставляет глобальную точку доступа к нему.

**Назначение в проекте:** Подключение к PostgreSQL должно существовать в единственном экземпляре на весь сервис. Создание нового соединения при каждом запросе - дорогостоящая операция. Singleton обеспечивает переиспользование единственного пула соединений.

**Как работает в коде:**  Переменная instance хранится снаружи класса. При создании new DatabasePool() - если instance уже есть, возвращается он. Если нет - создается новый и запоминается в instance. Строка export default new DatabasePool() означает что объект создается сразу при импорте файла - и больше никогда.

**UML-диаграмма:** [diagrams/01_singleton.puml](diagrams/01_singleton.puml)

**Код:**

```js
// pool.js - auth-service / products-service
import pg from "pg";

let instance = null;

class DatabasePool {
  constructor() {
    if (instance) return instance;

    this.pool = new pg.Pool({
      host:     process.env.DB_HOST     || "localhost",
      port:     Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME     || "electronics_db",
      user:     process.env.DB_USER     || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
    });

    instance = this;
  }

  /** Выполнить SQL-запрос и вернуть строки */
  async query(sql, params = []) {
    const { rows } = await this.pool.query(sql, params);
    return rows;
  }
}

// Единственный экземпляр на весь сервис
export default new DatabasePool();

// Использование в controller.js
import pool from "./pool.js";
const users = await pool.query("SELECT * FROM Users WHERE username = $1", [username]);
```

---

### 2. Factory Method (Фабричный метод)

**Общее назначение:** Определяет интерфейс для создания объекта, но позволяет подклассам изменять тип создаваемого объекта.

**Назначение в проекте:** В конфигураторе есть множество категорий товаров, каждая со своей спецификой. Фабричный метод позволяет создавать объекты нужной категории по строковому идентификатору, не привязываясь к конкретным классам.

**Как работает в коде:** ComponentFactory хранит словарь Map где ключ - строка "processor", значение - класс Processor. Метод create("processor", данные) достает из словаря нужный класс и создает объект через new Cls(...).


**UML-диаграмма:** [diagrams/02_factory_method.puml](diagrams/02_factory_method.puml)

**Код:**

```js
// components.js - products-service

class Component {
  constructor(name, price, storeName) {
    this.name = name;
    this.price = price;
    this.storeName = storeName;
  }

  getSpecs() {
    throw new Error("getSpecs() должен быть реализован в подклассе");
  }

  toDict() {
    return { name: this.name, price: this.price,
             storeName: this.storeName, specs: this.getSpecs() };
  }
}

class Processor extends Component {
  constructor(name, price, storeName, cores, socket, baseClock) {
    super(name, price, storeName);
    this.cores = cores;
    this.socket = socket;
    this.baseClock = baseClock;
  }
  getSpecs() {
    return { cores: this.cores, socket: this.socket, baseClock: this.baseClock };
  }
}

class GraphicsCard extends Component {
  constructor(name, price, storeName, memorySize, memoryType, gpuClock) {
    super(name, price, storeName);
    this.memorySize = memorySize;
    this.memoryType = memoryType;
    this.gpuClock = gpuClock;
  }
  getSpecs() {
    return { memorySize: this.memorySize, memoryType: this.memoryType,
             gpuClock: this.gpuClock };
  }
}

class Memory extends Component {
  constructor(name, price, storeName, totalCapacity, memoryFrequency, memoryType) {
    super(name, price, storeName);
    this.totalCapacity = totalCapacity;
    this.memoryFrequency = memoryFrequency;
    this.memoryType = memoryType;
  }
  getSpecs() {
    return { capacity: this.totalCapacity, frequency: this.memoryFrequency,
             type: this.memoryType };
  }
}

// Фабрика - создает нужный объект по строковому идентификатору
class ComponentFactory {
  static #registry = new Map([
    ["processor",    Processor],
    ["graphicsCard", GraphicsCard],
    ["memory",       Memory],
  ]);

  static register(category, cls) {
    this.#registry.set(category, cls);
  }

  static create(category, data) {
    const Cls = this.#registry.get(category);
    if (!Cls) throw new Error(`Неизвестная категория: ${category}`);
    return new Cls(...Object.values(data));
  }
}

// Использование
const cpu = ComponentFactory.create("processor", {
  name: "AMD Ryzen 7 7700X", price: 25000, storeName: "DNS",
  cores: "8", socket: "AM5", baseClock: "4.5 GHz"
});
console.log(cpu.toDict());
```

---

### 3. Builder (Строитель)

**Общее назначение:** Разделяет конструирование сложного объекта от его представления, позволяя создавать разные представления с помощью одного и того же процесса конструирования.

**Назначение в проекте:** Компьютерная сборка состоит из множества опциональных компонентов. Builder позволяет пошагово собирать конфигурацию и получать итоговый объект сборки.

**Как работает в коде:** Каждый метод setProcessor(), setMemory() и т.д. возвращает this - сам билдер. Это позволяет писать цепочку вызовов. getResult() в конце возвращает собранный объект. BuildDirector - это просто заготовка типичных сборок, чтобы не писать одно и то же каждый раз

**UML-диаграмма:** [diagrams/03_builder.puml](diagrams/03_builder.puml)

**Код:**

```js
// builder.js - products-service

class ComputerBuild {
  constructor() {
    this.processor    = null;
    this.motherboard  = null;
    this.memory       = null;
    this.graphicsCard = null;
    this.storage      = null;
    this.powerSupply  = null;
    this.case         = null;
  }

  getTotalPrice() {
    return [this.processor, this.motherboard, this.memory,
            this.graphicsCard, this.storage, this.powerSupply, this.case]
      .filter(Boolean)
      .reduce((sum, c) => sum + c.price, 0);
  }

  toDict() {
    return { ...this, totalPrice: this.getTotalPrice() };
  }
}

class ComputerBuildBuilder {
  constructor() { this._build = new ComputerBuild(); }

  setProcessor(data)   { this._build.processor    = data; return this; }
  setMotherboard(data) { this._build.motherboard  = data; return this; }
  setMemory(data)      { this._build.memory       = data; return this; }
  setGraphicsCard(data){ this._build.graphicsCard = data; return this; }
  setStorage(data)     { this._build.storage      = data; return this; }
  setPowerSupply(data) { this._build.powerSupply  = data; return this; }
  setCase(data)        { this._build.case         = data; return this; }
  getResult()          { return this._build; }
}

class BuildDirector {
  constructor(builder) { this._builder = builder; }

  makeGamingBuild() {
    return this._builder
      .setProcessor   ({ name: "AMD Ryzen 7 7700X",        price: 25000 })
      .setMotherboard ({ name: "ASUS ROG STRIX X670E",      price: 35000 })
      .setMemory      ({ name: "Kingston Fury 32GB DDR5",   price: 8000  })
      .setGraphicsCard({ name: "NVIDIA RTX 4070",           price: 55000 })
      .setStorage     ({ name: "Samsung 980 Pro 1TB",       price: 8000  })
      .setPowerSupply ({ name: "Seasonic Focus 750W",       price: 9000  })
      .setCase        ({ name: "Fractal Design Meshify",    price: 7000  })
      .getResult();
  }
}

// Использование
const builder  = new ComputerBuildBuilder();
const director = new BuildDirector(builder);
const gamingPC = director.makeGamingBuild();
console.log(`Игровая сборка: ${gamingPC.getTotalPrice()} руб.`); // 147000
```

---

## Структурные шаблоны

---

### 4. Facade (Фасад)

**Общее назначение:** Предоставляет простой интерфейс к сложной подсистеме, скрывая детали реализации.

**Назначение в проекте:** `api-gateway` является фасадом всей микросервисной архитектуры. Клиент не знает о существовании `auth-service` и `products-service` - он обращается к единой точке входа, которая сама маршрутизирует запросы.

**Как работает в коде:** forwardRequest() в api-gateway - это и есть фасад. Клиент делает POST /sign-in - gateway пересылает на http://localhost:3001/sign-in. Клиент никогда не видит реальных адресов сервисов.

**UML-диаграмма:** [diagrams/04_facade.puml](diagrams/04_facade.puml)

**Код:**

```js
// api-gateway/index.js (упрощенно)
import express from "express";
import fetch   from "node-fetch";

const AUTH_URL     = process.env.AUTH_SERVICE_URL     || "http://localhost:3001";
const PRODUCTS_URL = process.env.PRODUCTS_SERVICE_URL || "http://localhost:3002";

// Фасад - единая точка входа; скрывает маршрутизацию между сервисами
async function forwardRequest(req, res, targetBaseUrl) {
  const targetUrl = `${targetBaseUrl}${req.path}`;
  try {
    const response = await fetch(targetUrl, {
      method:  req.method,
      headers: { "Content-Type": "application/json",
                 ...(req.headers.authorization
                   ? { authorization: req.headers.authorization } : {}) },
      ...(req.method !== "GET" ? { body: JSON.stringify(req.body) } : {}),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ error: "Сервис недоступен" });
  }
}

const app = express();
app.use(express.json());

// Клиент видит только эти маршруты - не знает об отдельных сервисах
app.post("/sign-in",    (req, res) => forwardRequest(req, res, AUTH_URL));
app.post("/sign-up",    (req, res) => forwardRequest(req, res, AUTH_URL));
app.get("/verify-token",(req, res) => forwardRequest(req, res, AUTH_URL));
app.get("/processors",  (req, res) => forwardRequest(req, res, PRODUCTS_URL));
app.get("/cases",       (req, res) => forwardRequest(req, res, PRODUCTS_URL));
```

---

### 5. Decorator (Декоратор)

**Общее назначение:** Динамически добавляет объекту новые обязанности, являясь гибкой альтернативой наследованию.

**Назначение в проекте:** Компоненты конфигуратора могут иметь дополнительные характеристики - расширенная гарантия магазина или скидка. Декоратор оборачивает компонент, добавляя эти свойства без изменения базового класса.

**Как работает в коде:** WarrantyDecorator хранит внутри this._wrapped - оригинальный объект. Когда вызываете getPrice() - он возвращает this._wrapped.getPrice() + стоимость_гарантии. DiscountDecorator аналогично берет цену у _wrapped и применяет скидку. Декораторы можно складывать в любом порядке и количестве.

**UML-диаграмма:** [diagrams/05_decorator.puml](diagrams/05_decorator.puml)

**Код:**

```js
// decorator.js - products-service

class ConcreteComponent {
  constructor(name, price) {
    this.name  = name;
    this._price = price;
  }
  getPrice()       { return this._price; }
  getDescription() { return this.name; }
}

class WarrantyDecorator {
  constructor(component, years = 2) {
    this._wrapped = component;
    this._years   = years;
    this._cost    = years * 500;
  }
  getPrice()       { return this._wrapped.getPrice() + this._cost; }
  getDescription() {
    return `${this._wrapped.getDescription()} + гарантия ${this._years} года`;
  }
}

class DiscountDecorator {
  constructor(component, percent) {
    this._wrapped = component;
    this._percent = percent;
  }
  getPrice() {
    return Math.floor(this._wrapped.getPrice() * (1 - this._percent / 100));
  }
  getDescription() {
    return `${this._wrapped.getDescription()} (скидка ${this._percent}%)`;
  }
}

// Использование
const cpu           = new ConcreteComponent("AMD Ryzen 7 7700X", 25000);
const withWarranty  = new WarrantyDecorator(cpu, 2);        // +1000 руб.
const withDiscount  = new DiscountDecorator(withWarranty, 10); // −10%

console.log(withDiscount.getDescription());
// AMD Ryzen 7 7700X + гарантия 2 года (скидка 10%)
console.log(withDiscount.getPrice()); // 23400
```

---

### 6. Adapter (Адаптер)

**Общее назначение:** Преобразует интерфейс класса в другой интерфейс, ожидаемый клиентом. Позволяет совместно использовать классы с несовместимыми интерфейсами.

**Назначение в проекте:** При интеграции со сторонними магазинами данные приходят в чужом формате. Адаптер преобразует его к единому внутреннему интерфейсу `IProductRepository`.

**UML-диаграмма:** [diagrams/06_adapter.puml](diagrams/06_adapter.puml)

**Как работает в коде:** ExternalShopAdapter реализует тот же интерфейс что и DatabaseProductRepository (оба имеют getAll() и getById()). Внутри getAll() он вызывает this._api.fetchItems() и через _convert() переводит каждый объект в нужный формат. Контроллер не знает с кем работает - с БД или внешним API.

**Код:**

```js
// adapter.js - products-service

// Внутренний интерфейс (контракт)
// interface IProductRepository { getAll(); getById(id) }

class DatabaseProductRepository {
  constructor(pool) { this._pool = pool; }

  async getAll() {
    const rows = await this._pool.query("SELECT id, name, price, store_name FROM Processors");
    return rows.map(r => ({ id: r.id, name: r.name, price: r.price, storeName: r.store_name }));
  }

  async getById(id) {
    const rows = await this._pool.query(
      "SELECT id, name, price, store_name FROM Processors WHERE id = $1", [id]);
    const r = rows[0];
    return { id: r.id, name: r.name, price: r.price, storeName: r.store_name };
  }
}

// Внешний API стороннего магазина - чужой несовместимый формат
class ExternalShopAPI {
  async fetchItems() {
    // Возвращает данные в своем формате
    return [{ sku: "CPU-001", title: "Intel Core i9", costRub: 45000, vendor: "DNS" }];
  }
  async fetchItemDetail(sku) {
    return { sku, title: "Intel Core i9", costRub: 45000 };
  }
}

// Адаптер - приводит внешний формат к IProductRepository
class ExternalShopAdapter {
  constructor(externalApi) {
    this._api   = externalApi;
    this._cache = null;
  }

  _convert(item) {
    return { id: item.sku, name: item.title,
             price: item.costRub, storeName: item.vendor || "Внешний магазин" };
  }

  async getAll() {
    if (!this._cache) this._cache = await this._api.fetchItems();
    return this._cache.map(item => this._convert(item));
  }

  async getById(id) {
    const item = await this._api.fetchItemDetail(id);
    return this._convert(item);
  }
}

// Использование - одинаковый интерфейс независимо от источника
const repo = new ExternalShopAdapter(new ExternalShopAPI());
const products = await repo.getAll();
```

---

### 7. Composite (Компоновщик)

**Общее назначение:** Компонует объекты в древовидные структуры для представления иерархий «часть–целое». Позволяет клиентам единообразно работать с отдельными объектами и их группами.

**Назначение в проекте:** Корзина пользователя содержит как отдельные товары, так и готовые наборы («бандл: процессор + материнская плата»). Компоновщик позволяет единообразно получить итоговую цену как одного товара, так и целого набора.

**UML-диаграмма:** [diagrams/07_composite.puml](diagrams/07_composite.puml)\

**Как работает в коде:** SingleProduct.getPrice() возвращает просто число. ProductBundle.getPrice() проходит по всем дочерним элементам и суммирует их getPrice(). Можно вкладывать бандлы в бандлы - все равно getPrice() посчитает правильно рекурсивно.

**Код:**

```js
// composite.js - client/scripts/cart.js (логика корзины)

class SingleProduct {
  constructor(name, price) {
    this.name   = name;
    this._price = price;
  }
  getPrice()  { return this._price; }
  getItems()  { return [{ name: this.name, price: this._price }]; }
}

class ProductBundle {
  constructor(name) {
    this.name     = name;
    this._children = [];
  }

  add(item)    { this._children.push(item); }
  remove(item) { this._children = this._children.filter(c => c !== item); }

  // Единообразный интерфейс - клиент не знает, лист это или узел
  getPrice()  { return this._children.reduce((s, c) => s + c.getPrice(), 0); }
  getItems()  { return this._children.flatMap(c => c.getItems()); }
}

// Использование
const cpu  = new SingleProduct("AMD Ryzen 7 7700X", 25000);
const mb   = new SingleProduct("ASUS ROG X670E",    35000);
const ram  = new SingleProduct("Kingston Fury 32GB", 8000);

const bundle = new ProductBundle("Бандл: основа сборки");
bundle.add(cpu);
bundle.add(mb);

const cart = new ProductBundle("Корзина");
cart.add(bundle);
cart.add(ram);

console.log(`Итого: ${cart.getPrice()} руб.`); // 68000
console.log(cart.getItems());
```

---

## Поведенческие шаблоны

---

### 8. Observer (Наблюдатель)

**Общее назначение:** Определяет зависимость «один ко многим» так, что при изменении состояния одного объекта все зависящие от него объекты уведомляются и обновляются автоматически.

**Назначение в проекте:** При изменении цены товара необходимо уведомить несколько подсистем: инвалидировать кэш, уведомить пользователей с товаром в корзине и записать событие в лог.

**UML-диаграмма:** [diagrams/08_observer.puml](diagrams/08_observer.puml)

**Как работает в коде:** PriceChangeNotifier хранит массив _observers. Метод notify() проходит по массиву и вызывает update() у каждого. Добавить новое действие при изменении цены - просто создать новый класс с update() и добавить его через subscribe(). Сам PriceChangeNotifier при этом не меняется.

**Код:**

```js
// observer.js - products-service

class PriceChangeNotifier {
  constructor() { this._observers = []; }

  subscribe(observer)   { this._observers.push(observer); }
  unsubscribe(observer) {
    this._observers = this._observers.filter(o => o !== observer);
  }

  notify(event, data) {
    this._observers.forEach(o => o.update(event, data));
  }

  async changePrice(productId, newPrice) {
    // Обновление в БД...
    console.log(`[DB] Цена товара ${productId} изменена на ${newPrice} руб.`);
    this.notify("price_changed", { productId, newPrice });
  }
}

class CacheInvalidator {
  update(event, data) {
    if (event === "price_changed")
      console.log(`[Cache] Инвалидация кэша для товара ${data.productId}`);
  }
}

class UserNotifier {
  update(event, data) {
    if (event === "price_changed")
      console.log(`[Notify] Пользователи с товаром ${data.productId} в корзине уведомлены`);
  }
}

class AuditLogger {
  update(event, data) {
    console.log(`[Log] ${event}:`, data);
  }
}

// Использование
const notifier = new PriceChangeNotifier();
notifier.subscribe(new CacheInvalidator());
notifier.subscribe(new UserNotifier());
notifier.subscribe(new AuditLogger());

await notifier.changePrice(42, 23000);
```

---

### 9. Strategy (Стратегия)

**Общее назначение:** Определяет семейство алгоритмов, инкапсулирует каждый из них и делает их взаимозаменяемыми.

**Назначение в проекте:** Сортировка каталога товаров может выполняться по разным критериям: по цене (возрастание/убывание) или по названию. Стратегия позволяет переключать алгоритм сортировки без изменения кода каталога.

**UML-диаграмма:** [diagrams/09_strategy.puml](diagrams/09_strategy.puml)

**Как работает в коде:**

**Код:** Каждый класс сортировки (SortByPriceAsc, SortByName и т.д.) имеет метод sort(items). ProductCatalog хранит текущую стратегию и вызывает this._strategy.sort(items). Чтобы изменить сортировку - просто catalog.setStrategy(new SortByName()).

```js
// strategy.js - client/scripts/fetchData.js

class SortByPriceAsc {
  sort(items) { return [...items].sort((a, b) => a.price - b.price); }
}

class SortByPriceDesc {
  sort(items) { return [...items].sort((a, b) => b.price - a.price); }
}

class SortByName {
  sort(items) { return [...items].sort((a, b) => a.name.localeCompare(b.name)); }
}

class ProductCatalog {
  constructor(items) {
    this._items    = items;
    this._strategy = new SortByPriceAsc(); // стратегия по умолчанию
  }

  setStrategy(strategy) { this._strategy = strategy; }
  getSorted()           { return this._strategy.sort(this._items); }
}

// Использование
const products = [
  { name: "RTX 4090", price: 120000 },
  { name: "RTX 4070", price: 55000  },
  { name: "RTX 4060", price: 30000  },
];

const catalog = new ProductCatalog(products);

catalog.setStrategy(new SortByPriceDesc());
console.log("По убыванию цены:", catalog.getSorted().map(p => p.name));

catalog.setStrategy(new SortByName());
console.log("По названию:", catalog.getSorted().map(p => p.name));
```

---

### 10. Command (Команда)

**Общее назначение:** Инкапсулирует запрос как объект, позволяя организовывать очереди запросов и поддерживать отмену операций.

**Назначение в проекте:** Операции с корзиной (добавить, удалить, очистить) оформляются как команды. Это позволяет реализовать историю операций и возможность отмены (`undo`).

**UML-диаграмма:** [diagrams/10_command.puml](diagrams/10_command.puml)

**Как работает в коде:** AddToCartCommand хранит _cart и _product. Метод execute() добавляет товар, undo() - удаляет. CartCommandHistory хранит стек выполненных команд. undoLast() достает последнюю команду из стека и вызывает ее undo().

**Код:**

```js
// command.js - client/scripts/cart.js

class Cart {
  constructor() { this._items = []; }
  add(product)        { this._items.push(product); }
  remove(productId)   { this._items = this._items.filter(i => i.id !== productId); }
  getItems()          { return [...this._items]; }
}

class AddToCartCommand {
  constructor(cart, product) {
    this._cart    = cart;
    this._product = product;
  }
  execute() {
    this._cart.add(this._product);
    console.log(`[Cart] Добавлено: ${this._product.name}`);
  }
  undo() {
    this._cart.remove(this._product.id);
    console.log(`[Cart] Отменено добавление: ${this._product.name}`);
  }
}

class RemoveFromCartCommand {
  constructor(cart, productId) {
    this._cart      = cart;
    this._productId = productId;
    this._removed   = null;
  }
  execute() {
    this._removed = this._cart.getItems().find(i => i.id === this._productId);
    this._cart.remove(this._productId);
    console.log(`[Cart] Удалено: ${this._productId}`);
  }
  undo() {
    if (this._removed) {
      this._cart.add(this._removed);
      console.log(`[Cart] Восстановлено: ${this._removed.name}`);
    }
  }
}

class CartCommandHistory {
  constructor() { this._history = []; }
  execute(command) { command.execute(); this._history.push(command); }
  undoLast()       { this._history.pop()?.undo(); }
}

// Использование
const cart    = new Cart();
const history = new CartCommandHistory();

const cpu = { id: 1, name: "AMD Ryzen 7 7700X", price: 25000 };
const gpu = { id: 2, name: "RTX 4070",           price: 55000 };

history.execute(new AddToCartCommand(cart, cpu));
history.execute(new AddToCartCommand(cart, gpu));
console.log("Корзина:", cart.getItems().map(i => i.name));

history.undoLast(); // отменяем добавление gpu
console.log("После отмены:", cart.getItems().map(i => i.name));
```

---

### 11. Template Method (Шаблонный метод)

**Общее назначение:** Определяет скелет алгоритма в базовом классе, откладывая реализацию некоторых шагов на подклассы.

**Назначение в проекте:** Получение товаров для любой категории следует одному алгоритму: SQL-запрос → маппинг строк → фильтрация. Отличается только запрос и структура данных. Шаблонный метод фиксирует этот алгоритм, оставляя детали подклассам.

**UML-диаграмма:** [diagrams/11_template_method.puml](diagrams/11_template_method.puml)

**Как работает в коде:** BaseProductController.getProducts() - это шаблон алгоритма, он вызывает this.getQuery() и this.mapRow(). Эти методы в базовом классе бросают ошибку - их обязан реализовать подкласс. ProcessorController реализует свой SQL и свое маппинг - и получает рабочий getProducts() бесплатно.

**Код:**

```js
// controller.js - products-service (рефакторинг)

class BaseProductController {
  constructor(pool) { this._pool = pool; }

  /** Шаблонный метод - скелет алгоритма (не переопределяется) */
  async getProducts() {
    const rows  = await this._pool.query(this.getQuery());  // шаг 1
    const items = rows.map(row => this.mapRow(row));         // шаг 2
    return this.filterItems(items);                          // шаг 3
  }

  /** Шаг 1: SQL-запрос - реализуется в подклассе */
  getQuery() { throw new Error("getQuery() не реализован"); }

  /** Шаг 2: маппинг строки БД в объект - реализуется в подклассе */
  mapRow(row) { throw new Error("mapRow() не реализован"); }

  /** Шаг 3: фильтрация - базовая реализация, можно переопределить */
  filterItems(items) { return items; }
}

class ProcessorController extends BaseProductController {
  getQuery() {
    return "SELECT id, name, cores, socket, price, store_name FROM Processors";
  }
  mapRow(row) {
    return { id: row.id, name: row.name, cores: row.cores,
             socket: row.socket, price: row.price, storeName: row.store_name };
  }
}

class GraphicsCardController extends BaseProductController {
  getQuery() {
    return "SELECT id, name, memory_size, gpu_clock, price, store_name FROM GraphicsCards";
  }
  mapRow(row) {
    return { id: row.id, name: row.name, memorySize: row.memory_size,
             gpuClock: row.gpu_clock, price: row.price, storeName: row.store_name };
  }
}

// Использование
// const ctrl = new ProcessorController(pool);
// const processors = await ctrl.getProducts();
```

---

### 12. Chain of Responsibility (Цепочка обязанностей)

**Общее назначение:** Избегает привязки отправителя запроса к его получателю, давая нескольким объектам возможность обработать запрос по цепочке.

**Назначение в проекте:** При регистрации пользователя запрос проходит цепочку валидаций: длина имени → длина пароля → уникальность в БД. Каждый обработчик либо отклоняет запрос с сообщением, либо передает его дальше.

**UML-диаграмма:** [diagrams/12_chain_of_responsibility.puml](diagrams/12_chain_of_responsibility.puml)

**Как работает в коде:** Каждый валидатор хранит ссылку на _next - следующий в цепочке. Если проверка не прошла - возвращает ошибку. Если прошла - вызывает super.handle(data), что равносильно this._next.handle(data). Цепочка собирается через setNext() который возвращает аргумент - это позволяет писать a.setNext(b).setNext(c).

**Код:**

```js
// validator.js - auth-service

class ValidationHandler {
  constructor() { this._next = null; }

  setNext(handler) { this._next = handler; return handler; }

  handle(data) {
    if (this._next) return this._next.handle(data);
    return { ok: true };
  }

  _fail(message) { return { ok: false, message }; }
}

class UsernameLengthValidator extends ValidationHandler {
  handle(data) {
    if ((data.username || "").length < 4)
      return this._fail("Длина имени пользователя должна быть не менее 4 символов");
    return super.handle(data);
  }
}

class PasswordLengthValidator extends ValidationHandler {
  handle(data) {
    if ((data.password || "").length < 8)
      return this._fail("Длина пароля должна быть не менее 8 символов");
    return super.handle(data);
  }
}

class UniqueUsernameValidator extends ValidationHandler {
  constructor(pool) { super(); this._pool = pool; }

  async handle(data) {
    const rows = await this._pool.query(
      "SELECT id FROM Users WHERE username = $1", [data.username]);
    if (rows.length > 0)
      return this._fail("Пользователь с таким именем уже существует");
    return super.handle(data);
  }
}

// Сборка цепочки
function buildRegistrationValidator(pool) {
  const usernameCheck = new UsernameLengthValidator();
  const passwordCheck = new PasswordLengthValidator();
  const uniqueCheck   = new UniqueUsernameValidator(pool);

  usernameCheck.setNext(passwordCheck).setNext(uniqueCheck);
  return usernameCheck;
}

// Использование в controller.js (auth-service)
export const signUp = async (req, res) => {
  const { username, password } = req.body;
  const validator = buildRegistrationValidator(pool);
  const result    = await validator.handle({ username, password });

  if (!result.ok)
    return res.status(400).json({ status: false, message: result.message });

  // ... хеширование пароля и сохранение
};
```

---

# Шаблоны проектирования GRASP

GRASP - это принципы мышления: как вообще решать, кому что поручить в системе

## Роли (обязанности) классов

---

### 1. Information Expert (Информационный эксперт)

**Проблема:** Кому назначить обязанность вычисления общей стоимости корзины? Неправильное распределение приводит к тому, что один класс знает слишком много о внутреннем устройстве другого.

**Решение:** Назначить обязанность тому классу, который владеет необходимой информацией. `Cart` хранит список товаров - он и считает итог.Information Expert - логика должна жить рядом с данными. Cart хранит товары - Cart и считает сумму. Не внешний сервис, не контроллер.

**Код:**

```js
class Cart {
  constructor() { this._items = []; }

  addItem(product)  { this._items.push(product); }

  // Information Expert - Cart знает свои items, поэтому считает сам
  getTotalPrice()   { return this._items.reduce((s, i) => s + i.price, 0); }
  getItemCount()    { return this._items.length; }
}
```

**Результаты:** Низкая связанность - никто не лезет во внутреннюю структуру чужого класса. Логика живет рядом с данными.

**Связь с другими паттернами:** Тесно связан с Low Coupling и High Cohesion. Используется при реализации Composite (узел знает цену потомков) и Builder (строитель знает как собрать объект).

---

### 2. Creator (Создатель)

**Проблема:** Кто должен создавать объекты? Бесконтрольное создание в произвольных местах кода ведет к высокой связанности.

**Решение:** Назначить классу B создавать объекты A, если B содержит, агрегирует или активно использует A. `OrderService` создает `Order`, потому что управляет заказами.Creator - кто создает объекты? Тот, кто ими управляет. OrderService управляет заказами - он и создает Order

**Код:**

```js
class Order {
  constructor(userId, items, total) {
    this.userId = userId;
    this.items  = items;
    this.total  = total;
    this.status = "pending";
  }
}

class OrderService {
  // Creator - OrderService агрегирует данные для Order, поэтому создает его
  createOrder(userId, cart) {
    const items = cart.getItems();
    const total = cart.getTotalPrice();
    const order = new Order(userId, items, total); // создатель
    this._save(order);
    return order;
  }
  _save(order) { /* сохранение в БД */ }
}
```

**Результаты:** Четкое распределение ответственности за создание объектов, уменьшение связанности.

**Связь с другими паттернами:** Реализуется через Factory Method (явный создатель) и Builder (строитель создает сложные объекты).

---

### 3. Controller (Контроллер)

**Проблема:** Кто обрабатывает входящие HTTP-запросы? Если бизнес-логику размещать прямо в Express-обработчиках - получается нетестируемый монолитный код.

**Решение:** Промежуточный класс-контроллер принимает запрос, координирует доменные объекты и возвращает ответ. Сам бизнес-логики не содержит.Controller - HTTP-запросы принимает отдельный класс-контроллер. Он не содержит бизнес-логики - только координирует. Ваш controller.js в auth-service - именно это.

**Код:**

```js
// controller.js - auth-service
import pool    from "./pool.js";
import helpers from "./helpers.js";
import bcrypt  from "bcrypt";

export const signIn = async (req, res) => {
  const { username, password } = req.body;

  // Контроллер координирует - делегирует в пул, helpers, bcrypt
  const rows = await pool.query(
    "SELECT * FROM Users WHERE username = $1", [username]);

  if (!rows.length)
    return res.status(400).json({ status: false, message: "Пользователь не существует" });

  const match = await bcrypt.compare(password, rows[0].password);
  if (!match)
    return res.status(400).json({ status: false, message: "Пароли не совпадают" });

  const token = helpers.generateToken({ username });
  return res.json({ status: true, token });
};
```

**Результаты:** HTTP-обработка отделена от бизнес-логики. Контроллер легко тестируется через Supertest (что и реализовано в `tests/auth.test.js`).


**Связь с другими паттернами:** Facade (контроллер как фасад HTTP-слоя), Chain of Responsibility (цепочка валидаций вызывается из контроллера).

---

### 4. Low Coupling (Низкая связанность)

**Проблема:** Классы имеют слишком много прямых зависимостей. Изменение одного класса вызывает цепную реакцию изменений по всей системе.

**Решение:** Вводить зависимости через интерфейсы и инъекцию зависимостей. Контроллер зависит от абстракции `IProductRepository`, а не от конкретного `DatabaseProductRepository`.Low Coupling - чем меньше классы знают друг о друге, тем лучше. Контроллер получает репозиторий через параметр конструктора, а не создает сам - это позволяет подменить его в тестах.


**Код:**

```js
// Плохо - жесткая зависимость
class ProductsControllerBad {
  constructor() {
    this._repo = new DatabaseProductRepository(pool); // нельзя подменить
  }
}

// Хорошо - Low Coupling через инъекцию зависимостей
class ProductsController {
  constructor(repository) {
    this._repo = repository; // зависимость от интерфейса, передается снаружи
  }
  async getProducts() { return this._repo.getAll(); }
}

// При тестировании подменяем реализацию - контроллер не меняется
class MockRepository {
  async getAll()     { return [{ id: 1, name: "Test CPU", price: 1000 }]; }
  async getById(id)  { return { id, name: "Test CPU", price: 1000 }; }
}

const controller = new ProductsController(new MockRepository());
```

**Результаты:** Модули можно изменять и тестировать независимо. `ExternalShopAdapter` подключается без изменения контроллера.

**Связь с другими паттернами:** Достигается через Adapter, Strategy, Facade. Является предусловием для High Cohesion.

---

### 5. High Cohesion (Высокая связность)

**Проблема:** Класс выполняет слишком много несвязанных задач (God Object) - это затрудняет понимание, поддержку и тестирование.

**Решение:** Каждый класс должен иметь четко ограниченный круг обязанностей. Аутентификация, товары и заказы - три отдельных сервиса.High Cohesion - класс делает одно дело. auth-service - только авторизация. products-service - только товары. Не смешивать

**Код:**

```js
// Плохо - низкая связность
class GodService {
  signIn()        { /* ... */ }
  getProcessors() { /* ... */ }
  createOrder()   { /* ... */ }
  sendEmail()     { /* ... */ }
  generateReport(){ /* ... */ }
}

// Хорошо - каждый сервис делает одно дело
// auth-service/controller.js - только аутентификация
export const signIn    = async (req, res) => { /* ... */ };
export const signUp    = async (req, res) => { /* ... */ };
export const verifyToken = async (req, res) => { /* ... */ };

// products-service/controller.js - только каталог товаров
export const getCases         = async (req, res) => { /* ... */ };
export const getProcessors    = async (req, res) => { /* ... */ };
export const getGraphicsCards = async (req, res) => { /* ... */ };
```

**Результаты:** Изменения в аутентификации не затрагивают товарный каталог. Каждый сервис можно масштабировать и деплоить независимо.

**Связь с другими паттернами:** Low Coupling и High Cohesion - взаимодополняющая пара. Template Method усиливает связность (общий алгоритм сосредоточен в одном месте).

---

## Принципы разработки

---

### 1. Pure Fabrication (Чистая выдумка)

**Проблема:** Какому классу назначить техническую обязанность, которая не относится ни к одному доменному объекту? Хеширование паролей и работа с JWT не являются частью домена «пользователь» или «товар».

**Решение:** Создать искусственный класс-утилиту, отвечающий только за эту техническую задачу.Pure Fabrication - иногда нужен класс который не представляет реальный объект из предметной области, но нужен технически. helpers.js с JWT - не является ни пользователем, ни товаром. Это «чистая выдумка» ради удобства

**Код:**

```js
// helpers.js - auth-service
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "supersecretkey";

// Pure Fabrication - вспомогательный класс, не представляющий доменный объект
const helpers = {
  generateToken(payload) {
    return jwt.sign(payload, SECRET, { expiresIn: "24h" });
  },

  verifyToken(token) {
    return jwt.verify(token, SECRET);
  },
};

export default helpers;

// Использование в controller.js
import helpers from "./helpers.js";
const token = helpers.generateToken({ username });
```

**Результаты:** Доменные объекты остаются чистыми. Технические обязанности вынесены в переиспользуемые утилиты.

**Связь с другими паттернами:** Часто реализуется как Singleton. Снижает связанность доменных классов (Low Coupling).

---

### 2. Indirection (Перенаправление)

**Проблема:** Как избежать прямой зависимости между двумя компонентами? Клиент не должен знать адреса конкретных микросервисов - это хрупкая зависимость.

**Решение:** Ввести промежуточный объект-посредник. В нашем проекте `api-gateway` - это посредник между браузером и микросервисами. Адреса сервисов вынесены в переменные окружения.Indirection - посредник снижает зависимость. api-gateway стоит между браузером и сервисами - ни браузер, ни сервисы не знают друг о друге напрямую

**Код:**

```js
// api-gateway/index.js
// Indirection - переменные окружения как уровень перенаправления.
// Клиент (браузер) обращается к gateway, не зная о существовании
// отдельных auth-service и products-service.

const AUTH_URL     = process.env.AUTH_SERVICE_URL     || "http://localhost:3001";
const PRODUCTS_URL = process.env.PRODUCTS_SERVICE_URL || "http://localhost:3002";

// В docker-compose.yml - сервисы ссылаются друг на друга по именам контейнеров:
// AUTH_SERVICE_URL: http://auth-service:3001
// PRODUCTS_SERVICE_URL: http://products-service:3002

// Если products-service переедет на другой порт - меняем только переменную.
// Ни gateway, ни клиент не меняются.
```

**Результаты:** Адрес сервиса меняется в одном месте. Сервисы можно переносить без изменения клиентского кода.

**Связь с другими паттернами:** Реализуется через Facade и Adapter. Является основой для Low Coupling.

---

### 3. Polymorphism (Полиморфизм)

**Проблема:** Как обрабатывать различные типы товаров без громоздких `if/else`? Добавление новой категории не должно требовать изменения существующего кода.

**Решение:** Определить общий интерфейс. Каждый тип реализует его по-своему. Код работает через общий интерфейс - не зная конкретного типа.Polymorphism - вместо if (category === "processor") используем общий интерфейс. buildProductHTML() работает с любым товаром через единый контракт.

**Код:**

```js
// Полиморфизм через общий интерфейс buildProductHTML()
// products-service/controller.js

function buildProductHTML(product, fields) {
  // Единая функция - работает с любым товаром через общий интерфейс
  const specs = fields.map(([label, key]) =>
    `<p>${label}: ${product[key]}</p>`).join("");

  return `<div class="products_item">
    <img src="${product.image_url}" alt="${product.name}">
    <h3>${product.name}</h3>
    ${specs}
    <span>${product.price} руб.</span>
  </div>`;
}

// Каждая категория задает свои поля - полиморфное поведение
export const getProcessors = async (req, res) => {
  const rows = await pool.query("SELECT * FROM Processors");
  const html = rows.map(p => buildProductHTML(p, [
    ["Ядра", "cores"], ["Сокет", "socket"], ["Частота", "base_clock"]
  ])).join("");
  res.json(html);
};

export const getGraphicsCards = async (req, res) => {
  const rows = await pool.query("SELECT * FROM GraphicsCards");
  const html = rows.map(p => buildProductHTML(p, [
    ["Память", "memory_size"], ["Тип", "memory_type"], ["Частота", "gpu_clock"]
  ])).join("");
  res.json(html);
};
// Добавление новой категории - только новый вызов buildProductHTML, без if/else
```

**Результаты:** Добавление новой категории - только новый обработчик, без изменения `buildProductHTML`. Соответствие принципу Open/Closed.

**Связь с другими паттернами:** Основа для Strategy, Factory Method, Template Method.

---

## Свойство программы (цель)

---

### Protected Variations (Защита от изменений)

**Проблема:** Как защитить систему от изменений в нестабильных компонентах? База данных, JWT-библиотека, алгоритм хеширования, адреса микросервисов - все это может измениться. Прямые зависимости от конкретных реализаций делают систему хрупкой.

**Решение:** Выявить точки нестабильности и ввести стабильный интерфейс вокруг каждой из них. Вся система строится вокруг стабильных контрактов - конкретные реализации подключаются снаружи.Protected Variations - это итоговая цель всего вышеперечисленного. Найти что в программе может измениться (БД, JWT-библиотека, адреса сервисов) и обернуть каждую точку нестабильности в стабильный интерфейс. Тогда смена любого компонента - это изменение одного файла, а не рефакторинг всей системы. В вашем проекте это достигается через pool.js, helpers.js, переменные окружения и интерфейс IProductRepository

**Код:**

```js
// Точки нестабильности в проекте и как они защищены:

// 1. База данных - защищена через pool.js (единый интерфейс query())
//    Смена pg на mysql2 требует изменения только pool.js
import pool from "./pool.js";
const rows = await pool.query("SELECT * FROM Users WHERE username = $1", [username]);

// 2. JWT - защищена через helpers.js
//    Смена jsonwebtoken на jose требует изменения только helpers.js
import helpers from "./helpers.js";
const token = helpers.generateToken({ username });
const payload = helpers.verifyToken(token);

// 3. Хеширование - защищена через bcrypt как утилиту (Pure Fabrication)
//    Смена bcrypt на argon2 - только в одном месте
const hash  = await bcrypt.hash(password, 10);
const match = await bcrypt.compare(password, hash);

// 4. Адреса микросервисов - защищены через переменные окружения (Indirection)
//    Смена адреса - только в .env или docker-compose.yml
const AUTH_URL = process.env.AUTH_SERVICE_URL || "http://localhost:3001";

// 5. Репозиторий товаров - защищен через IProductRepository (Adapter)
//    Смена БД на внешний API - только замена реализации, контроллер не меняется
class ProductsController {
  constructor(repository) { this._repo = repository; }
  async getProducts()     { return this._repo.getAll(); }
}
// Передаем нужную реализацию снаружи:
const ctrl = new ProductsController(new DatabaseProductRepository(pool));
// или:
const ctrl = new ProductsController(new ExternalShopAdapter(new ExternalShopAPI()));
```

**Результаты:** Смена базы данных, JWT-библиотеки или алгоритма хеширования требует изменения только одного файла. Все контроллеры и сервисы остаются неизменными. Система устойчива к наиболее вероятным изменениям.

**Связь с другими паттернами:** Protected Variations - это цель, которую достигают через Adapter (адаптирует нестабильный интерфейс), Strategy (переключаемые алгоритмы), Facade (скрывает нестабильную подсистему), Indirection (переменные окружения), Pure Fabrication (технические утилиты), а также через Low Coupling и High Cohesion.
