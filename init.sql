-- Переконуємося, що працюємо з правильною базою
SET NAMES utf8mb4;
USE sppr_db;

-- 1. Таблиця проєктів
CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id INT
);

-- 2. Таблиця альтернатив
CREATE TABLE alternatives (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 3. Таблиця критеріїв (Додано поле weight)
CREATE TABLE criteria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('maximize', 'minimize') NOT NULL,
    weight DECIMAL(5, 4) DEFAULT 1.0000,
    description TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 4. Таблиця оцінок (Матриця)
CREATE TABLE evaluations (
    alternative_id INT NOT NULL,
    criterion_id INT NOT NULL,
    value DECIMAL(10, 4) NOT NULL,
    PRIMARY KEY (alternative_id, criterion_id),
    FOREIGN KEY (alternative_id) REFERENCES alternatives(id) ON DELETE CASCADE,
    FOREIGN KEY (criterion_id) REFERENCES criteria(id) ON DELETE CASCADE
);

-- ==========================================
-- ТЕСТОВІ ДАНІ: Вибір ноутбука
-- ==========================================

INSERT INTO projects (name, description, user_id) 
VALUES ('Вибір ноутбука', 'Оптимальний вибір робочого інструменту', 1);

INSERT INTO alternatives (project_id, name, description) VALUES 
(1, 'Laptop A (Бюджетний)', 'Базовий рівень, дешевий'),
(1, 'Laptop B (Оптимальний)', 'Середній клас, збалансований'),
(1, 'Laptop C (Преміум)', 'Висока продуктивність, дорогий');

-- Ваги: Ціна (50%), Продуктивність (30%), Автономність (20%)
INSERT INTO criteria (project_id, name, type, weight, description) VALUES 
(1, 'Ціна', 'minimize', 0.5000, 'Вартість у $ (менше - краще)'),
(1, 'Продуктивність', 'maximize', 0.3000, 'Бали у бенчмарку (більше - краще)'),
(1, 'Автономність', 'maximize', 0.2000, 'Час роботи у годинах (більше - краще)');

INSERT INTO evaluations (alternative_id, criterion_id, value) VALUES 
-- Laptop A
(1, 1, 500),   
(1, 2, 4000),  
(1, 3, 6),     
-- Laptop B
(2, 1, 800),   
(2, 2, 7500),  
(2, 3, 8),     
-- Laptop C
(3, 1, 1500),  
(3, 2, 12000), 
(3, 3, 4);