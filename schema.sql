-- EchoAisle MySQL schema
-- Run this in phpMyAdmin or the MySQL command line to create the database.

CREATE DATABASE IF NOT EXISTS voice_shop
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE voice_shop;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  aisle VARCHAR(100) NOT NULL,
  keywords TEXT NOT NULL,
  steps TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed data: 12 starter products
INSERT INTO products (name, category, aisle, keywords, steps) VALUES
('Soap', 'Personal Care', 'Personal Care - Aisle 3',
  'soap|hand soap|bar soap|body soap',
  'Walk forward 8 steps from the entrance|Turn right at the first crossing|Walk forward 6 steps|Soap is on the left shelf at waist height'),
('Shampoo', 'Personal Care', 'Personal Care - Aisle 3',
  'shampoo|hair wash|conditioner',
  'Walk forward 8 steps from the entrance|Turn right at the first crossing|Walk forward 10 steps|Shampoo bottles are on the right shelf at chest height'),
('Toothpaste', 'Personal Care', 'Personal Care - Aisle 3',
  'toothpaste|paste|tooth|brush',
  'Walk forward 8 steps from the entrance|Turn right at the first crossing|Walk forward 4 steps|Toothpaste is on the left shelf at eye level'),
('Bread', 'Bakery', 'Bakery - Aisle 1',
  'bread|loaf|bun|toast',
  'Walk forward 4 steps from the entrance|Turn left|Walk forward 6 steps|Bread is in the open basket on your right'),
('Milk', 'Dairy', 'Dairy - Aisle 5',
  'milk|dairy milk|cow milk',
  'Walk forward 8 steps from the entrance|Continue straight 12 more steps|Turn left at the cold section|Milk cartons are in the refrigerator on your right'),
('Bottled Water', 'Beverages', 'Beverages - Aisle 4',
  'water|bottle|drinking water|mineral water',
  'Walk forward 8 steps from the entrance|Continue straight 6 more steps|Turn right|Water bottles are stacked on the left'),
('Chips', 'Snacks', 'Snacks - Aisle 6',
  'chips|crisps|snack|wafers',
  'Walk forward 8 steps from the entrance|Continue straight 16 more steps|Turn right|Chips are on the middle shelves on both sides'),
('Frozen Pizza', 'Frozen', 'Frozen - Aisle 7',
  'pizza|frozen pizza|frozen food',
  'Walk forward 8 steps from the entrance|Continue straight 18 more steps|Turn left into the freezer aisle|Pizza is in the third freezer on your right'),
('Coffee', 'Beverages', 'Beverages - Aisle 4',
  'coffee|instant coffee|coffee powder',
  'Walk forward 8 steps from the entrance|Continue straight 6 more steps|Turn right|Coffee jars are on the right shelf at chest height'),
('Detergent', 'Household', 'Household - Aisle 8',
  'detergent|washing powder|laundry|soap powder',
  'Walk forward 8 steps from the entrance|Continue straight 20 more steps|Turn left|Detergent boxes are on the bottom shelf'),
('Eggs', 'Dairy', 'Dairy - Aisle 5',
  'eggs|egg|dozen eggs',
  'Walk forward 8 steps from the entrance|Continue straight 12 more steps|Turn left at the cold section|Egg trays are on the shelf next to the milk'),
('Bananas', 'Groceries', 'Produce - Aisle 2',
  'banana|bananas|fruit',
  'Walk forward 4 steps from the entrance|Turn right|Walk forward 4 steps|Bananas are in the open crate on your left');
