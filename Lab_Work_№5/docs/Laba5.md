# Лабораторная работа №5

## Тема
Реализация архитектуры на основе сервисов (микросервисной архитектуры)

## Цель работы
Получить опыт работы организации взаимодействия сервисов с использованием контейнеров Docker

---

# Отчёт по работе: Контейнеризация и CI/CD микросервисного приложения

## Описание проекта

**Конфигуратор компьютерной сборки** - веб-приложение, позволяющее пользователям просматривать комплектующие (процессоры, видеокарты, материнские платы, оперативную память, накопители, блоки питания, корпуса), добавлять их в корзину и оформлять сборку. Приложение поддерживает регистрацию и авторизацию пользователей через JWT-токены.

Исходный монолитный сервер был разделён на независимые микросервисы, каждый из которых упакован в Docker-контейнер.

---

## Пункт 1 - Контейнеризация: выделение минимум 3 контейнеров

### Архитектура контейнеров

Приложение разбито на **5 контейнеров**, взаимодействующих между собой через внутреннюю Docker-сеть:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Браузер пользователя                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │ :8080
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              client (Nginx) - контейнер 1                       │
│         Статические файлы: HTML, CSS, JavaScript                │
└──────────────────────────┬──────────────────────────────────────┘
                           │ :3000
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│            api-gateway (Node.js) - контейнер 2                  │
│     Единая точка входа, маршрутизирует запросы к сервисам       │
└──────────┬───────────────────────────────┬──────────────────────┘
           │ :3001                         │ :3002
           ▼                               ▼
┌─────────────────────┐       ┌────────────────────────┐
│  auth-service       │       │   products-service      │
│  контейнер 3        │       │   контейнер 4           │
│                     │       │                         │
│  POST /sign-in      │       │  GET /cases             │
│  POST /sign-up      │       │  GET /processors        │
│  GET /verify-token  │       │  GET /graphics-cards    │
│                     │       │  GET /memory            │
└────────┬────────────┘       │  GET /motherboards      │
         │                    │  GET /power-supplies    │
         └──────────┬─────────│  GET /storage           │
                    │         └───────────┬─────────────┘
                    ▼                     ▼
         ┌────────────────────────────────────┐
         │   PostgreSQL - контейнер 5         │
         │   База данных electronics_db       │
         │   Таблицы: Users, Processors,      │
         │   GraphicsCards, Memory,           │
         │   Motherboards, PowerSupplies,     │
         │   Storage, Cases                   │
         └────────────────────────────────────┘
```

### Созданные файлы

#### `auth-service/Dockerfile`
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "index.js"]
```
Образ на основе минимального Alpine Linux с Node.js 20.

#### `products-service/Dockerfile`
Аналогичен auth-service, отличается только портом (3002).

#### `api-gateway/Dockerfile`
Аналогичен, порт 3000.

#### `client/Dockerfile`
```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
```
Клиент - это набор статических файлов (HTML/CSS/JS), поэтому используется лёгкий веб-сервер Nginx вместо Node.js.

#### `docker-compose.yml`
Главный файл оркестрации. Описывает все 5 сервисов, их зависимости и переменные окружения:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: electronics_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      retries: 10

  auth-service:
    build: ./auth-service
    environment:
      DB_HOST: postgres   # имя контейнера, не localhost
    depends_on:
      postgres:
        condition: service_healthy

  # ... остальные сервисы
```

Ключевые моменты:
- `healthcheck` у PostgreSQL гарантирует, что сервисы запустятся только после готовности БД
- `depends_on` выстраивает порядок запуска
- `database.sql` монтируется в `docker-entrypoint-initdb.d` - PostgreSQL автоматически выполняет его при первом запуске и создаёт все таблицы
- `postgres_data` - именованный volume, данные БД сохраняются между перезапусками

### Запуск

```bash
docker compose up --build
```

После запуска доступны:
| Адрес | Что открывается |
|-------|----------------|
| http://localhost:8080 | Веб-приложение (страница входа) |
| http://localhost:3000/health | Статус API Gateway |
| http://localhost:3001/health | Статус Auth Service |
| http://localhost:3002/health | Статус Products Service |
| http://localhost:3000/cases-json | Данные из БД (корпуса) |

---

## Пункт 2 - Непрерывная интеграция (CI)

### Файл `.github/workflows/ci.yml`

GitHub Actions - встроенный в GitHub инструмент автоматизации. Файл `ci.yml` описывает пайплайн, который запускается автоматически при каждом `git push` и `pull request` в ветки `main`, `master`, `develop`.

Пайплайн состоит из трёх последовательных задач (jobs):

#### Job 1 - Интеграционные тесты сервисов
GitHub поднимает PostgreSQL как сервис, устанавливает зависимости и запускает `npm test` для auth-service и products-service.

#### Job 2 - Тесты API Gateway
Запускается только после успеха Job 1. Поднимает все три сервиса в фоне, ждёт их готовности через `curl /health` и запускает тесты маршрутизации.

#### Job 3 - Сборка Docker-образов
Запускается параллельно с Job 2. Собирает все 4 образа через `docker/build-push-action` с `push: false` - проверяет валидность Dockerfile без публикации. Использует кэширование слоёв через GitHub Actions Cache.

```yaml
- name: 🏗️ Сборка auth-service
  uses: docker/build-push-action@v5
  with:
    context: ./auth-service
    push: false          # только проверка сборки, без публикации
    tags: configurator/auth-service:ci
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

### Результат

При каждом пуше в GitHub во вкладке **Actions** отображается статус пайплайна. Если тесты или сборка упали - разработчик немедленно получает уведомление и видит в каком именно шаге ошибка.

---

## Пункт 3 - Интеграционные тесты

### Подход

Интеграционные тесты проверяют реальное взаимодействие компонентов: настоящий HTTP-запрос -> Express-роутер -> SQL-запрос -> PostgreSQL -> ответ. Для тестирования используются **Jest** + **Supertest**.

Для тестируемости приложение рефакторингом разделено на два файла в каждом сервисе:
- `app.js` - Express-приложение (импортируется тестами)
- `index.js` - только запуск сервера (`app.listen(...)`)

### `auth-service/tests/auth.test.js` - 9 тестов

| Группа | Тест |
|--------|------|
| GET /health | Сервис живой и отвечает |
| POST /sign-up | Успешная регистрация, возвращает JWT |
| POST /sign-up | Отказ при дублирующемся пользователе |
| POST /sign-up | Отказ при имени короче 4 символов |
| POST /sign-up | Отказ при пароле короче 8 символов |
| POST /sign-in | Успешный вход, возвращает JWT |
| POST /sign-in | Отказ при неверном пароле |
| POST /sign-in | Отказ при несуществующем пользователе |
| GET /verify-token | Валидный токен -> 200, невалидный -> 400 |

### `products-service/tests/products.test.js` - 21 тест

Для каждой из 7 категорий товаров проверяется:
- HTML-эндпоинт возвращает строку с карточками (`products_item`)
- JSON-эндпоинт возвращает непустой массив
- Каждый элемент содержит обязательные поля (`id`, `name`, `price`, `store_name`)

Перед тестами в БД вставляются тестовые записи (`beforeAll`), после - удаляются (`afterAll`).

### `api-gateway/tests/gateway.test.js`

Тестирует маршрутизацию через реально запущенный gateway. Включает сквозной тест полного flow:

```
POST /sign-up -> получить токен
POST /sign-in -> войти с теми же данными
GET /verify-token -> убедиться что токен валиден
```

### Включение в CI

Тесты встроены в Job 1 пайплайна `ci.yml`. Jest возвращает ненулевой код завершения при провале любого теста - GitHub Actions воспринимает это как ошибку и блокирует дальнейшие шаги (сборку образов и публикацию).

---

## Повышенная сложность - Непрерывное развёртывание (CD)

### Файл `.github/workflows/cd.yml`

CD-пайплайн запускается **только при пуше в ветку `main`** - то есть когда код прошёл ревью и готов к релизу.

### Настройка секретов

В настройках GitHub репозитория (Settings -> Secrets -> Actions) добавлены два секрета:
- `DOCKER_USERNAME` - логин на hub.docker.com
- `DOCKER_PASSWORD` - Access Token (не пароль), созданный в Docker Hub -> Account Settings -> Security

Секреты никогда не отображаются в логах - GitHub маскирует их автоматически.

### Процесс публикации

```yaml
- name: 🔐 Авторизация на Docker Hub
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKER_USERNAME }}
    password: ${{ secrets.DOCKER_PASSWORD }}

- name: 🚀 Публикация auth-service
  uses: docker/build-push-action@v5
  with:
    context: ./auth-service
    push: true
    tags: |
      ${{ secrets.DOCKER_USERNAME }}/configurator-auth-service:latest
      ${{ secrets.DOCKER_USERNAME }}/configurator-auth-service:${{ steps.tags.outputs.sha }}
```

Каждый образ публикуется с двумя тегами:
- `latest` - всегда указывает на последнюю версию
- `abc1234` (короткий git SHA коммита) - позволяет откатиться к конкретной версии

### Итоговые образы на Docker Hub

После успешного CD на hub.docker.com публикуются:
```
ВАШ_ЛОГИН/configurator-auth-service:latest
ВАШ_ЛОГИН/configurator-products-service:latest
ВАШ_ЛОГИН/configurator-api-gateway:latest
ВАШ_ЛОГИН/configurator-client:latest
```

Любой пользователь может развернуть приложение одной командой:
```bash
docker pull ВАШ_ЛОГИН/configurator-auth-service:latest
```

### Полный CI/CD поток

```
git push origin develop
        │
        ▼
  GitHub Actions CI
  ┌─────────────────────────────────────────┐
  │  Job 1: Тесты auth + products (Jest)    │
  │  Job 2: Тесты gateway (end-to-end)      │
  │  Job 3: Сборка Docker-образов (проверка)│
  └─────────────────────────────────────────┘
        │ Всё зелёное -> merge в main
        ▼
  GitHub Actions CD
  ┌─────────────────────────────────────────┐
  │  Авторизация на Docker Hub              │
  │  Сборка 4 образов                       │
  │  Публикация с тегами :latest и :sha     │
  └─────────────────────────────────────────┘
        │
        ▼
  hub.docker.com - образы доступны публично
```

---

## Структура файлов проекта

```
microservices/
├── .github/
│   └── workflows/
│       ├── ci.yml              # Пайплайн CI: тесты + сборка образов
│       └── cd.yml              # Пайплайн CD: публикация на Docker Hub
│
├── api-gateway/
│   ├── Dockerfile
│   ├── index.js                # Запуск сервера
│   ├── package.json
│   └── tests/
│       └── gateway.test.js     # Интеграционные тесты маршрутизации
│
├── auth-service/
│   ├── Dockerfile
│   ├── app.js                  # Express-приложение
│   ├── index.js                # Запуск сервера
│   ├── controller.js           # Логика sign-in, sign-up, verify-token
│   ├── helpers.js              # Генерация и верификация JWT
│   ├── pool.js                 # Подключение к PostgreSQL
│   ├── package.json
│   └── tests/
│       └── auth.test.js        # 9 интеграционных тестов
│
├── products-service/
│   ├── Dockerfile
│   ├── app.js
│   ├── index.js
│   ├── controller.js           # Логика всех 7 категорий товаров
│   ├── pool.js
│   ├── package.json
│   └── tests/
│       └── products.test.js    # 21 интеграционный тест
│
├── client/
│   ├── Dockerfile              # Nginx для статических файлов
│   ├── index.html
│   ├── cart.html
│   ├── sign-in.html
│   ├── sign-up.html
│   ├── scripts/
│   │   ├── config.js           # Центральный конфиг URL API
│   │   └── ...
│   └── styles/
│
├── docker-compose.yml          # Оркестрация всех 5 контейнеров
├── docker-compose.test.yml     # Изолированное окружение для тестов
├── database.sql                # SQL-схема + тестовые данные
└── package.json                # Корневой: concurrently для dev-запуска
```
