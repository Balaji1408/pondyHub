-- Seed data for hub_1 — Pondicherry / Pondy Hub
USE hub_1;

INSERT INTO rooms (name, slug, category, room_type, min_members, max_members, price_per_night, description, location, images, amenities, rating) VALUES
('Maison Blanche Suite', 'maison-blanche-suite', 'couples', 'Heritage Suite', 1, 2, 4500.00,
 'Colonial charm in White Town with private courtyard and breakfast.', 'White Town, Puducherry',
 JSON_ARRAY(
   'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=900&q=80',
   'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=900&q=80',
   'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=900&q=80',
   'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900&q=80'
 ),
 JSON_ARRAY('AC','Breakfast','WiFi','Courtyard'), 4.8),
('Promenade Sea View', 'promenade-sea-view', 'couples', 'Sea View Double', 1, 2, 5200.00,
 'Wake up to Bay of Bengal views steps from the promenade.', 'Goubert Avenue',
 JSON_ARRAY(
   'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80',
   'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80',
   'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=900&q=80',
   'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&q=80'
 ),
 JSON_ARRAY('Sea View','AC','Balcony','Parking'), 4.9),
('Family Villa Auroville Edge', 'family-villa-auroville', 'family', '3BHK Villa', 3, 6, 8900.00,
 'Spacious villa near Auroville with garden and kitchen.', 'Auroville Road',
 JSON_ARRAY(
   'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80',
   'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=900&q=80',
   'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=900&q=80',
   'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=900&q=80'
 ),
 JSON_ARRAY('Kitchen','Garden','AC','Parking'), 4.7),
('Palm Court Family Stay', 'palm-court-family', 'family', 'Family Room', 2, 5, 6100.00,
 'Kid-friendly rooms near Serenity Beach with pool access.', 'Serenity Beach Area',
 JSON_ARRAY(
   'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80',
   'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=900&q=80',
   'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=900&q=80',
   'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=900&q=80'
 ),
 JSON_ARRAY('Pool','Kids Zone','WiFi','Breakfast'), 4.6),
('Friends Loft Beach House', 'friends-loft-beach', 'friends', 'Shared Loft', 4, 8, 7200.00,
 'Open loft perfect for friend groups — bikes on site.', 'Paradise Beach Road',
 JSON_ARRAY(
   'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=900&q=80',
   'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=900&q=80',
   'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=900&q=80',
   'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=80'
 ),
 JSON_ARRAY('Bikes','BBQ','WiFi','Common Lounge'), 4.5),
('Backpacker Pods Pondy', 'backpacker-pods', 'friends', 'Dorm Pods', 1, 4, 1800.00,
 'Stylish pods for backpacker crews near Mission Street.', 'Mission Street',
 JSON_ARRAY(
   'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=900&q=80',
   'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&q=80',
   'https://images.unsplash.com/photo-1584622781867-64310d961839?w=900&q=80',
   'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&q=80'
 ),
 JSON_ARRAY('Lockers','Cafe','WiFi'), 4.3);

UPDATE rooms SET
  base_guests = IF(category = 'couples', 2, GREATEST(min_members, 1)),
  extra_guest_price = ROUND(price_per_night * 0.2 / 50) * 50;

INSERT INTO vehicles (name, type, with_driver, price_per_day, description, seats, images, rating) VALUES
('Royal Enfield Classic 350', 'bike', 0, 900.00, 'Cruise the East Coast Road on a classic.', 2,
 JSON_ARRAY('https://images.unsplash.com/photo-1694956792421-e946fff94564?w=800&q=80'), 4.8),
('Honda Activa Scooter', 'scooter', 0, 450.00, 'Easy city hops through White Town lanes.', 2,
 JSON_ARRAY('https://upload.wikimedia.org/wikipedia/commons/7/79/Honda_Activa_Scooter_at_Bakkannapalem.JPG'), 4.6),
('TVS Jupiter Scooter', 'scooter', 0, 400.00, 'Fuel-efficient daily rental.', 2,
 JSON_ARRAY('https://upload.wikimedia.org/wikipedia/commons/1/19/TVS_Jupiter_Scooter.jpg'), 4.4),
('Suzuki Access Self Drive', 'scooter', 0, 480.00, 'Helmets included, pickup at boulevard.', 2,
 JSON_ARRAY('https://upload.wikimedia.org/wikipedia/commons/f/f3/Suzuki_Access_125.jpg'), 4.5),
('Swift Dzire Self Drive', 'car', 0, 2200.00, 'Compact sedan for ECR day trips.', 5,
 JSON_ARRAY('https://upload.wikimedia.org/wikipedia/commons/6/61/Maruti_Suzuki_Dzire_VXi_VVT_-_Subcompact_Car_-_Kolkata_2018-01-17_7574.JPG'), 4.7),
('Innova Crysta with Driver', 'car', 1, 4500.00, 'AC MPV with experienced local driver.', 7,
 JSON_ARRAY('https://images.unsplash.com/photo-1748215210950-536c6621629a?w=800&q=80'), 4.9),
('Etios with Driver', 'car', 1, 3200.00, 'Airport transfers and temple circuits.', 4,
 JSON_ARRAY('https://upload.wikimedia.org/wikipedia/commons/b/b7/2018_Toyota_Etios_1.5_XLS_5-door.jpg'), 4.6),
('Yamaha FZ Bike', 'bike', 0, 700.00, 'Sporty ride for beach roads.', 2,
 JSON_ARRAY('https://images.unsplash.com/photo-1630787283150-519a05fefee3?w=800&q=80'), 4.5);

INSERT INTO boats (name, type, seats, price, description, slots, routes, images, rating) VALUES
('Bay Yacht Sunset', 'yacht', 12, 15000.00, 'Private yacht sunset sail with soft drinks.',
 JSON_ARRAY('16:00','17:00','18:00'),
 JSON_ARRAY(JSON_OBJECT('name','Promenade → Chunnambar → Back','duration','2 hrs','stops',JSON_ARRAY('Promenade Jetty','Chunnambar','Return'))),
 JSON_ARRAY('https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&q=80'), 4.9),
('Morning Yacht Cruise', 'yacht', 10, 12000.00, 'Calm morning waters and photo stops.',
 JSON_ARRAY('07:00','08:30','10:00'),
 JSON_ARRAY(JSON_OBJECT('name','Harbour Loop','duration','90 min','stops',JSON_ARRAY('New Harbour','Lighthouse View','Harbour'))),
 JSON_ARRAY('https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=800&q=80'), 4.8),
('Paddle Paradise', 'paddle', 2, 600.00, 'Paddle boats at Chunnambar backwaters.',
 JSON_ARRAY('09:00','10:00','11:00','15:00','16:00'),
 JSON_ARRAY(JSON_OBJECT('name','Backwater Circuit','duration','45 min','stops',JSON_ARRAY('Boathouse','Mangrove bend','Boathouse'))),
 JSON_ARRAY('https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80'), 4.5),
('Family Paddle Boat', 'paddle', 4, 900.00, 'Four-seat paddle for families.',
 JSON_ARRAY('09:30','11:00','15:30'),
 JSON_ARRAY(JSON_OBJECT('name','Island Edge','duration','60 min','stops',JSON_ARRAY('Start','Island edge','Return'))),
 JSON_ARRAY('https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&q=80'), 4.4),
('Kayak Duo Serenity', 'kayak', 2, 800.00, 'Guided kayak near Serenity Beach.',
 JSON_ARRAY('06:30','07:30','16:30'),
 JSON_ARRAY(JSON_OBJECT('name','Coastal Kayak','duration','75 min','stops',JSON_ARRAY('Serenity','Rocky cove','Serenity'))),
 JSON_ARRAY('https://images.unsplash.com/photo-1468413253725-0d5181091126?w=800&q=80'), 4.6),
('Catamaran Island Hop', 'catamaran', 20, 1800.00, 'Shared catamaran to Paradise Beach.',
 JSON_ARRAY('09:00','11:00','13:00','15:00'),
 JSON_ARRAY(JSON_OBJECT('name','Chunnambar → Paradise Beach','duration','20 min each way','stops',JSON_ARRAY('Chunnambar','Paradise Beach'))),
 JSON_ARRAY('https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=800&q=80'), 4.7);

-- Beaches first (ids 1-3) so bars/cafes can reference near_beach_id
INSERT INTO places (name, kind, description, location, opens_at, closes_at, best_visit_time, is_seafood_spot, near_room_id, near_beach_id, images, rating) VALUES
('Promenade Beach', 'beach', 'Iconic seaside walk with lighthouse views and evening breeze.', 'Goubert Avenue',
 NULL, NULL, '5:30 AM sunrise · 5–7 PM sunset', 0, 2, NULL,
 JSON_ARRAY('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80','https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=800&q=80'), 4.9),
('Paradise Beach', 'beach', 'Boat-access only sandy stretch — day trip favourite.', 'Chunnambar / Paradise',
 NULL, NULL, '9 AM – 4 PM (boat timings)', 1, 5, NULL,
 JSON_ARRAY('https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&q=80','https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=800&q=80'), 4.8),
('Serenity Beach', 'beach', 'Surf-friendly beach north of town with seafood shacks.', 'Kottakuppam',
 NULL, NULL, '6–9 AM surf · evenings for walks', 1, 4, NULL,
 JSON_ARRAY('https://images.unsplash.com/photo-1471922694854-ff1b63b20054?w=800&q=80','https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&q=80'), 4.7);

INSERT INTO places (name, kind, description, location, opens_at, closes_at, best_visit_time, is_seafood_spot, near_room_id, near_beach_id, images, rating) VALUES
('Café des Arts', 'cafe', 'Courtyard café with French pastries in White Town.', 'Rue Suffren',
 '08:00:00', '21:00:00', NULL, 0, 1, NULL,
 JSON_ARRAY('https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80'), 4.7),
('Bread & Breakfast', 'cafe', 'All-day brunch near the promenade.', 'Goubert Avenue',
 '07:30:00', '22:00:00', NULL, 0, 2, NULL,
 JSON_ARRAY('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80'), 4.6),
('Le Café Seaside', 'restaurant', 'Government café on the beachfront — classic Pondy.', 'Promenade Beach',
 '08:00:00', '22:00:00', NULL, 1, 2, 1,
 JSON_ARRAY('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'), 4.5),
('Villa Shanti Dining', 'restaurant', 'Fine dining in a heritage villa.', 'White Town',
 '12:00:00', '23:00:00', NULL, 0, 1, NULL,
 JSON_ARRAY('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80'), 4.8),
('ECR Roadside Dosa Hut', 'roadside', 'Late-night dosas on the ECR.', 'ECR Highway',
 '17:00:00', '02:00:00', NULL, 0, 4, NULL,
 JSON_ARRAY('https://images.unsplash.com/photo-1630383249896-424e482df921?w=800&q=80'), 4.4),
('Fisherman Catch Stall', 'roadside', 'Fresh catch fry near Serenity.', 'Serenity Beach Road',
 '11:00:00', '21:00:00', NULL, 1, 4, 3,
 JSON_ARRAY('https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80'), 4.6),
('Bay of Bengal Bar', 'bar', 'Rooftop cocktails overlooking Promenade Beach.', 'Near Promenade',
 '16:00:00', '00:30:00', NULL, 0, 2, 1,
 JSON_ARRAY('https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80'), 4.7),
('Serenity Surf Bar', 'bar', 'Chilled beach bar with live music weekends.', 'Serenity Beach',
 '12:00:00', '23:00:00', NULL, 0, 4, 3,
 JSON_ARRAY('https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&q=80'), 4.5),
('Paradise Shack Bar', 'bar', 'Sand-floor drinks after the boat ride.', 'Paradise Beach',
 '10:00:00', '17:00:00', NULL, 0, 5, 2,
 JSON_ARRAY('https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80'), 4.3),
('Goubert Market Food Street', 'foodstreet', 'Street eats, juices, and local sweets near the boulevard.', 'Goubert Market',
 '10:00:00', '22:00:00', 'Evening for the full buzz', 0, 2, 1,
 JSON_ARRAY('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80'), 4.6),
('Mission Street Night Bites', 'foodstreet', 'Crowded evening lane of snacks and Chinese carts.', 'Mission Street',
 '17:00:00', '00:00:00', 'After 7 PM', 0, 6, NULL,
 JSON_ARRAY('https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80','https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=800&q=80'), 4.5),
('French Quarter Coloniale', 'whitetown', 'Pastel façades, bougainvillea, and quiet cobbled streets.', 'White Town / French Quarter',
 NULL, NULL, 'Golden hour 4–6 PM for photos', 0, 1, NULL,
 JSON_ARRAY('https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&q=80','https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80','https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80'), 4.9),
('Raj Niwas & Cathedral Trail', 'whitetown', 'Heritage walk past Raj Niwas and the Sacred Heart Cathedral.', 'White Town',
 NULL, NULL, 'Morning 8–10 AM cooler walks', 0, 1, NULL,
 JSON_ARRAY('https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80','https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80'), 4.8),
('Seafood Spot Promenade', 'restaurant', 'Grilled catch with sea breeze — best near Promenade Beach.', 'Promenade',
 '11:00:00', '22:30:00', NULL, 1, 2, 1,
 JSON_ARRAY('https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800&q=80'), 4.7),
('Paradise Beach Seafood Grill', 'roadside', 'Beachside seafood after landing at Paradise.', 'Paradise Beach',
 '10:00:00', '16:30:00', NULL, 1, 5, 2,
 JSON_ARRAY('https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&q=80'), 4.5);
