-- ============================================================
--  База данных для Конфигуратора компьютерной сборки
--  Выполните этот файл в PostgreSQL перед запуском проекта
-- ============================================================

-- Создать базу данных (выполнить от имени суперпользователя)
-- CREATE DATABASE electronics_db;

-- После подключения к electronics_db выполните:

CREATE TABLE IF NOT EXISTS Users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS Processors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cores VARCHAR(255) NOT NULL,
    threads VARCHAR(255) NOT NULL,
    socket VARCHAR(255) NOT NULL,
    warranty VARCHAR(255) NOT NULL,
    base_clock VARCHAR(255) NOT NULL,
    turbo_clock VARCHAR(255) NOT NULL,
    tdp VARCHAR(255) NOT NULL,
    price INTEGER NOT NULL,
    product_url VARCHAR(255) NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    store_name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS Motherboards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    socket VARCHAR(255) NOT NULL,
    chipset VARCHAR(255) NOT NULL,
    memory_type VARCHAR(255) NOT NULL,
    memory_slots VARCHAR(255) NOT NULL,
    country_of_origin VARCHAR(255) NOT NULL,
    price INTEGER NOT NULL,
    product_url VARCHAR(255) NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    store_name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS GraphicsCards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    warranty VARCHAR(255) NOT NULL,
    memory_size VARCHAR(255) NOT NULL,
    memory_type VARCHAR(255) NOT NULL,
    gpu_clock VARCHAR(255) NOT NULL,
    price INTEGER NOT NULL,
    product_url VARCHAR(255) NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    store_name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS Memory (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    warranty VARCHAR(255) NOT NULL,
    country_of_origin VARCHAR(255) NOT NULL,
    module_capacity VARCHAR(255) NOT NULL,
    total_capacity VARCHAR(255) NOT NULL,
    memory_frequency VARCHAR(255) NOT NULL,
    memory_type VARCHAR(255) NOT NULL,
    modules_in_kit VARCHAR(255) NOT NULL,
    price INTEGER NOT NULL,
    product_url VARCHAR(255) NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    store_name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS Storage (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    warranty VARCHAR(255) NOT NULL,
    capacity VARCHAR(255) NOT NULL,
    max_read_speed VARCHAR(255) NOT NULL,
    max_write_speed VARCHAR(255) NOT NULL,
    price INTEGER NOT NULL,
    product_url VARCHAR(255) NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    store_name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS PowerSupplies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    warranty VARCHAR(255) NOT NULL,
    country_of_origin VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    power VARCHAR(255) NOT NULL,
    length VARCHAR(255) NOT NULL,
    width VARCHAR(255) NOT NULL,
    height VARCHAR(255) NOT NULL,
    price INTEGER NOT NULL,
    product_url VARCHAR(255) NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    store_name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS Cases (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    warranty VARCHAR(255) NOT NULL,
    weight VARCHAR(255) NOT NULL,
    material VARCHAR(255) NOT NULL,
    price INTEGER NOT NULL,
    product_url VARCHAR(255) NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    store_name VARCHAR(255) NOT NULL
);

-- ============================================================
--  Тестовые данные (опционально, для проверки работы)
-- ============================================================

INSERT INTO Cases (name, warranty, weight, material, price, product_url, image_url, store_name)
VALUES 
  ('NZXT H510', '2 года', '6.6 кг', 'Сталь + закалённое стекло', 8990, 'https://nzxt.com', 'https://via.placeholder.com/300x200?text=NZXT+H510', 'DNS'),
  ('Fractal Design Meshify C', '3 года', '5.8 кг', 'Сталь + акрил', 7490, 'https://fractal-design.com', 'https://via.placeholder.com/300x200?text=Fractal+Meshify', 'Citilink')
ON CONFLICT DO NOTHING;

INSERT INTO Processors (name, cores, threads, socket, warranty, base_clock, turbo_clock, tdp, price, product_url, image_url, store_name)
VALUES 
  ('AMD Ryzen 5 5600X', '6', '12', 'AM4', '3 года', '3.7 GHz', '4.6 GHz', '65W', 18990, 'https://amd.com', 'https://via.placeholder.com/300x200?text=Ryzen+5+5600X', 'DNS'),
  ('Intel Core i5-12600K', '10', '16', 'LGA1700', '3 года', '3.7 GHz', '4.9 GHz', '125W', 22490, 'https://intel.com', 'https://via.placeholder.com/300x200?text=i5-12600K', 'Citilink')
ON CONFLICT DO NOTHING;

INSERT INTO GraphicsCards (name, warranty, memory_size, memory_type, gpu_clock, price, product_url, image_url, store_name)
VALUES 
  ('NVIDIA RTX 3060', '3 года', '12 GB', 'GDDR6', '1320 MHz', 34990, 'https://nvidia.com', 'https://via.placeholder.com/300x200?text=RTX+3060', 'DNS'),
  ('AMD RX 6700 XT', '2 года', '12 GB', 'GDDR6', '2424 MHz', 38990, 'https://amd.com', 'https://via.placeholder.com/300x200?text=RX+6700+XT', 'Citilink')
ON CONFLICT DO NOTHING;

INSERT INTO Memory (name, warranty, country_of_origin, module_capacity, total_capacity, memory_frequency, memory_type, modules_in_kit, price, product_url, image_url, store_name)
VALUES 
  ('Kingston Fury Beast 16GB', 'Пожизненная', 'Тайвань', '8 GB', '16 GB', '3200 MHz', 'DDR4', '2 модуля', 4990, 'https://kingston.com', 'https://via.placeholder.com/300x200?text=Kingston+Fury', 'DNS'),
  ('Corsair Vengeance 32GB', 'Пожизненная', 'США', '16 GB', '32 GB', '3600 MHz', 'DDR4', '2 модуля', 9490, 'https://corsair.com', 'https://via.placeholder.com/300x200?text=Corsair+Vengeance', 'Citilink')
ON CONFLICT DO NOTHING;

INSERT INTO Motherboards (name, socket, chipset, memory_type, memory_slots, country_of_origin, price, product_url, image_url, store_name)
VALUES 
  ('ASUS ROG Strix B550-F', 'AM4', 'B550', 'DDR4', '4 слота', 'Тайвань', 15990, 'https://asus.com', 'https://via.placeholder.com/300x200?text=ROG+B550-F', 'DNS'),
  ('MSI MAG Z690 Tomahawk', 'LGA1700', 'Z690', 'DDR5', '4 слота', 'Китай', 21990, 'https://msi.com', 'https://via.placeholder.com/300x200?text=MSI+Z690', 'Citilink')
ON CONFLICT DO NOTHING;

INSERT INTO PowerSupplies (name, warranty, country_of_origin, model, power, length, width, height, price, product_url, image_url, store_name)
VALUES 
  ('Seasonic Focus GX-650', '10 лет', 'Тайвань', 'Focus GX', '650W', '140 мм', '150 мм', '86 мм', 8990, 'https://seasonic.com', 'https://via.placeholder.com/300x200?text=Seasonic+GX-650', 'DNS'),
  ('be quiet! Straight Power 11 750W', '5 лет', 'Германия', 'Straight Power 11', '750W', '160 мм', '150 мм', '86 мм', 10490, 'https://bequiet.com', 'https://via.placeholder.com/300x200?text=be+quiet!+750W', 'Citilink')
ON CONFLICT DO NOTHING;

INSERT INTO Storage (name, warranty, capacity, max_read_speed, max_write_speed, price, product_url, image_url, store_name)
VALUES 
  ('Samsung 970 EVO Plus 1TB', '5 лет', '1 TB', '3500 МБ/с', '3300 МБ/с', 7990, 'https://samsung.com', 'https://via.placeholder.com/300x200?text=Samsung+970+EVO', 'DNS'),
  ('WD Black SN850 1TB', '5 лет', '1 TB', '7000 МБ/с', '5300 МБ/с', 11990, 'https://wd.com', 'https://via.placeholder.com/300x200?text=WD+Black+SN850', 'Citilink')
ON CONFLICT DO NOTHING;
