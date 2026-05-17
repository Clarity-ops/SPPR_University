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

-- Таблиця для зберігання списку експертів у проекті
CREATE TABLE IF NOT EXISTS experts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Первинні оцінки експертів (для альтернатив за критеріями)
CREATE TABLE IF NOT EXISTS expert_evaluations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expert_id INT NOT NULL,
    alternative_id INT NOT NULL,
    criterion_id INT NOT NULL,
    value DOUBLE NOT NULL,
    FOREIGN KEY (expert_id) REFERENCES experts(id) ON DELETE CASCADE,
    FOREIGN KEY (alternative_id) REFERENCES alternatives(id) ON DELETE CASCADE,
    FOREIGN KEY (criterion_id) REFERENCES criteria(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS expert_weight_votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expert_id INT NOT NULL,
    criterion_id INT NOT NULL,
    vote_value DOUBLE NOT NULL, -- Ранг (1 - найважливіший, 2 - другий за важливістю і т.д.)
    FOREIGN KEY (expert_id) REFERENCES experts(id) ON DELETE CASCADE,
    FOREIGN KEY (criterion_id) REFERENCES criteria(id) ON DELETE CASCADE
);


-- Порогові значення для критеріїв (фільтрація)
CREATE TABLE IF NOT EXISTS criteria_thresholds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    criterion_id INT NOT NULL,
    min_value DOUBLE DEFAULT NULL,
    max_value DOUBLE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (criterion_id) REFERENCES criteria(id) ON DELETE CASCADE
);

-- Правила IF-THEN
CREATE TABLE IF NOT EXISTS expert_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    condition_json JSON NOT NULL, -- Опис умови, наприклад: {"criterion_id": 1, "operator": ">", "value": 1000}
    action_json JSON NOT NULL,    -- Дія, наприклад: {"type": "penalty", "impact": -0.2}
    description TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS scenarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    -- Можна зберігати JSON-зліпок ваг та порогів для цього сценарію
    config_snapshot JSON NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
-- ==========================================
-- ТЕСТОВІ ДАНІ: Вибір ноутбука
-- ==========================================

-- 1. Створюємо проєкт
INSERT INTO projects (id, name, description, user_id) 
VALUES (1, 'Вибір хмарного провайдера', 'Оцінка платформ для розгортання мікросервісного бекенду', 1);

-- 2. Створюємо 4 критерії
-- Зверни увагу: вартість мінімізуємо, все інше максимізуємо
INSERT INTO criteria (id, project_id, name, type, weight) VALUES
(1, 1, 'Щомісячна вартість ($)', 'minimize', 0),
(2, 1, 'Надійність (Uptime %)', 'maximize', 0),
(3, 1, 'Якість підтримки (1-10)', 'maximize', 0),
(4, 1, 'Простота використання (1-10)', 'maximize', 0);

-- 3. Створюємо 4 альтернативи
INSERT INTO alternatives (id, project_id, name, description) VALUES
(1, 1, 'Amazon Web Services', 'Світовий лідер, максимальний функціонал'),
(2, 1, 'Google Cloud Platform', 'Потужні інструменти для даних'),
(3, 1, 'Microsoft Azure', 'Інтеграція з корпоративним стеком'),
(4, 1, 'DigitalOcean', 'Дешевий хостинг для невеликих проєктів');

-- 4. Встановлюємо жорсткі пороги (Thresholds)
-- Uptime не може бути нижчим за 99.00%. Це правило автоматично дискваліфікує DigitalOcean.
INSERT INTO criteria_thresholds (project_id, criterion_id, min_value, max_value, is_active) 
VALUES (1, 2, 99.00, NULL, TRUE);

-- 5. Встановлюємо гнучкі правила (IF-THEN)
INSERT INTO expert_rules (project_id, rule_name, condition_json, action_json, description) VALUES
-- Правило 1: Якщо простота використання менша за 5, штрафуємо на 20%
(1, 'Штраф за складність', '{"criterionId": 4, "operator": "<", "value": 5}', '{"type": "penalty", "impact": 0.20}', 'Штраф для систем з високим порогом входу'),
-- Правило 2: Якщо підтримка оцінена на 9 або вище, даємо бонус 10%
(1, 'Бонус за підтримку', '{"criterionId": 3, "operator": ">=", "value": 9}', '{"type": "bonus", "impact": 0.10}', 'Бонус за преміум-саппорт');