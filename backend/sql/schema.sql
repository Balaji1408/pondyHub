-- Pondy Hub schema for database: hub_1
-- Import in phpMyAdmin after selecting hub_1

CREATE DATABASE IF NOT EXISTS hub_1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hub_1;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS places;
DROP TABLE IF EXISTS boats;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS rooms;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) NOT NULL UNIQUE,
  category ENUM('couples', 'family', 'friends') NOT NULL,
  room_type VARCHAR(80) NOT NULL,
  min_members INT NOT NULL DEFAULT 1,
  max_members INT NOT NULL DEFAULT 2,
  price_per_night DECIMAL(10, 2) NOT NULL,
  base_guests INT NOT NULL DEFAULT 2,
  extra_guest_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  description TEXT,
  location VARCHAR(200) NOT NULL,
  images JSON NOT NULL,
  amenities JSON,
  rating DECIMAL(2, 1) DEFAULT 4.5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  type ENUM('bike', 'scooter', 'car') NOT NULL,
  with_driver TINYINT(1) NOT NULL DEFAULT 0,
  price_per_day DECIMAL(10, 2) NOT NULL,
  description TEXT,
  seats INT DEFAULT 2,
  images JSON NOT NULL,
  rating DECIMAL(2, 1) DEFAULT 4.5,
  available TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE boats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  type ENUM('yacht', 'paddle', 'kayak', 'ferry', 'catamaran') NOT NULL,
  seats INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  slots JSON NOT NULL,
  routes JSON NOT NULL,
  images JSON NOT NULL,
  rating DECIMAL(2, 1) DEFAULT 4.5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE places (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  kind ENUM('cafe', 'restaurant', 'roadside', 'beach', 'bar', 'foodstreet', 'whitetown') NOT NULL,
  description TEXT,
  location VARCHAR(200),
  opens_at TIME NULL,
  closes_at TIME NULL,
  best_visit_time VARCHAR(120) NULL,
  is_seafood_spot TINYINT(1) DEFAULT 0,
  near_room_id INT NULL,
  near_beach_id INT NULL,
  images JSON NOT NULL,
  rating DECIMAL(2, 1) DEFAULT 4.5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_places_kind (kind),
  INDEX idx_places_near_room (near_room_id),
  CONSTRAINT fk_places_room FOREIGN KEY (near_room_id) REFERENCES rooms(id) ON DELETE SET NULL,
  CONSTRAINT fk_places_beach FOREIGN KEY (near_beach_id) REFERENCES places(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  confirmation_id VARCHAR(32) NOT NULL UNIQUE,
  booking_type ENUM('room', 'vehicle', 'boat') NOT NULL,
  item_id INT NOT NULL,
  booking_date DATE NOT NULL,
  slot VARCHAR(80) NULL,
  guests INT DEFAULT 1,
  extras JSON NULL,
  guest_name VARCHAR(120) NULL,
  guest_phone VARCHAR(20) NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'confirmed',
  total_amount DECIMAL(10, 2) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_bookings_confirmation (confirmation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
