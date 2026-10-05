-- Turso setup: creates tables and copies existing data.
-- Run with: turso db shell <your-db-name> < turso/setup.sql

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, description TEXT,
  active INTEGER NOT NULL DEFAULT 1, sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS tours (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, duration TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'easy', price REAL NOT NULL DEFAULT 0, image_url TEXT,
  active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime('now')),
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL, quad_type TEXT, route_from TEXT, route_to TEXT,
  distance_km REAL, terrain TEXT, included_items TEXT NOT NULL DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS quads (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, engine_size INTEGER NOT NULL, image_url TEXT,
  status TEXT NOT NULL DEFAULT 'available', hourly_rate REAL NOT NULL DEFAULT 0, daily_rate REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  quad_type TEXT, capacity INTEGER NOT NULL DEFAULT 1, transmission TEXT, short_description TEXT
);
CREATE TABLE IF NOT EXISTS offers (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, discount_percent INTEGER NOT NULL DEFAULT 0,
  starts_at TEXT NOT NULL, ends_at TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS section_videos (
  id TEXT PRIMARY KEY, section_key TEXT NOT NULL UNIQUE, label TEXT NOT NULL, video_url TEXT,
  active INTEGER NOT NULL DEFAULT 1, sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY, customer_name TEXT NOT NULL, customer_email TEXT NOT NULL, customer_phone TEXT,
  booking_date TEXT NOT NULL, tour_id TEXT REFERENCES tours(id) ON DELETE SET NULL,
  quad_id TEXT REFERENCES quads(id) ON DELETE SET NULL, participants INTEGER NOT NULL DEFAULT 1, notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL DEFAULT (datetime('now')),
  offer_id TEXT REFERENCES offers(id) ON DELETE SET NULL, offer_title TEXT, discount_percent INTEGER NOT NULL DEFAULT 0,
  subtotal REAL NOT NULL DEFAULT 0, total REAL NOT NULL DEFAULT 0,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL, route_from TEXT, route_to TEXT, quad_type TEXT
);

-- Existing data
INSERT INTO categories VALUES ('17ed1054-fe5b-413a-ad76-aca14c0d80c8','Sunset Rides','sunset-rides','Golden-hour quad routes across Agafay desert viewpoints.',1,10,'2026-04-25 19:02:51.896095+00','2026-04-25 19:02:51.896095+00');
INSERT INTO categories VALUES ('8a454b0d-3b3e-4271-97c7-130c219dbdc7','Family Friendly','family-friendly','Accessible quad experiences with calmer routes and guide support.',1,20,'2026-04-25 19:02:51.896095+00','2026-04-25 19:02:51.896095+00');
INSERT INTO categories VALUES ('720d42b5-a289-4d3d-94ff-c4b9342e51c1','Extreme Adventure','extreme-adventure','Higher-adrenaline routes with rocky tracks and longer distances.',1,30,'2026-04-25 19:02:51.896095+00','2026-04-25 19:02:51.896095+00');
INSERT INTO tours (id,name,description,duration,difficulty,price,image_url,active,created_at,category_id,quad_type,route_from,route_to,distance_km,terrain,included_items) VALUES ('1899b84a-9d9c-40e4-a1ef-8604f8b28723','Agafay Sunset Drive','Chase the golden hour across the rolling stone desert with our most iconic ride.','2 hours','easy',55.00,'/src/assets/tour-sunset.jpg',1,'2026-04-24 17:46:59.789987+00',NULL,NULL,NULL,NULL,NULL,NULL,'[]');
INSERT INTO tours (id,name,description,duration,difficulty,price,image_url,active,created_at,category_id,quad_type,route_from,route_to,distance_km,terrain,included_items) VALUES ('8557bc4a-66e7-4965-9565-09d9a504b5c3','Extreme Palmeraie Track','Punch through palm groves and dirt tracks. High-octane, full throttle.','3 hours','moderate',85.00,'/src/assets/tour-palmeraie.jpg',1,'2026-04-24 17:46:59.789987+00',NULL,NULL,NULL,NULL,NULL,NULL,'[]');
INSERT INTO tours (id,name,description,duration,difficulty,price,image_url,active,created_at,category_id,quad_type,route_from,route_to,distance_km,terrain,included_items) VALUES ('1a40e7e2-ef50-42fc-98fa-4a925eb94bab','Atlas Mountain Footprints','Ride to the foothills of the Atlas — rocky terrain, panoramic views.','Half day','extreme',140.00,'/src/assets/tour-atlas.jpg',1,'2026-04-24 17:46:59.789987+00',NULL,NULL,NULL,NULL,NULL,NULL,'[]');
INSERT INTO quads (id,name,engine_size,image_url,status,hourly_rate,daily_rate,created_at,updated_at,quad_type,capacity,transmission,short_description) VALUES ('7c07ec6d-a448-4dc1-a172-c86b5096ff78','Yamaha Raptor 700',700,'/src/assets/tour-sunset.jpg','available',45.00,260.00,'2026-04-24 17:46:59.789987+00','2026-04-24 17:46:59.789987+00',NULL,1,NULL,NULL);
INSERT INTO quads (id,name,engine_size,image_url,status,hourly_rate,daily_rate,created_at,updated_at,quad_type,capacity,transmission,short_description) VALUES ('7b050998-ebd4-444f-861a-a9a9b3e7e695','Honda TRX 450',450,'/src/assets/tour-palmeraie.jpg','available',35.00,200.00,'2026-04-24 17:46:59.789987+00','2026-04-24 17:46:59.789987+00',NULL,1,NULL,NULL);
INSERT INTO quads (id,name,engine_size,image_url,status,hourly_rate,daily_rate,created_at,updated_at,quad_type,capacity,transmission,short_description) VALUES ('820c0d08-8c30-44d4-aa99-a217c2454fcb','Polaris Sportsman 850',850,'/src/assets/tour-atlas.jpg','maintenance',55.00,310.00,'2026-04-24 17:46:59.789987+00','2026-04-24 17:46:59.789987+00',NULL,1,NULL,NULL);
INSERT INTO quads (id,name,engine_size,image_url,status,hourly_rate,daily_rate,created_at,updated_at,quad_type,capacity,transmission,short_description) VALUES ('1ea33cc0-e708-4122-ba59-d28feaf97ba6','Quad Biking',450,'https://gsvebtazjexkgplogtif.supabase.co/storage/v1/object/public/quad-images/1777053568136-Screenshot_2026-04-24_185901.png','available',10.00,200.00,'2026-04-24 18:00:07.633251+00','2026-04-24 18:00:07.633251+00',NULL,1,NULL,NULL);
INSERT INTO offers (id,title,description,discount_percent,starts_at,ends_at,active,created_at) VALUES ('f62fdb78-e84d-466a-bf05-6b6bce6e5c4c','Marrakech Summer Discount','Beat the heat — 20% off all sunset tours.',20,'2026-04-24','2026-06-23',1,'2026-04-24 17:46:59.789987+00');
INSERT INTO offers (id,title,description,discount_percent,starts_at,ends_at,active,created_at) VALUES ('db8817b3-65dd-4de9-9b7d-9487fd0236f0','Group Rates','Book 4 or more riders, get 15% off.',15,'2026-04-24','2027-04-24',1,'2026-04-24 17:46:59.789987+00');
INSERT INTO section_videos (id,section_key,label,video_url,active,sort_order,created_at,updated_at) VALUES ('a1cc5941-4f96-4e64-8786-5bc2f40a3a95','hero','Hero','https://pub-3fe2b2a234a04507951dc3d5646b7a33.r2.dev/174882-852541116.mp4',1,10,'2026-04-25 18:57:38.997238+00','2026-04-25 19:42:35.249128+00');
INSERT INTO section_videos (id,section_key,label,video_url,active,sort_order,created_at,updated_at) VALUES ('5ee1e7fe-0f59-4341-9ba1-a891d6936e98','highlights','Highlights',NULL,1,20,'2026-04-25 18:57:38.997238+00','2026-04-25 19:33:17.494042+00');
INSERT INTO section_videos (id,section_key,label,video_url,active,sort_order,created_at,updated_at) VALUES ('d1d1344c-834c-4323-86db-4c35428be659','tours','Tours',NULL,1,30,'2026-04-25 18:57:38.997238+00','2026-04-25 18:57:38.997238+00');
INSERT INTO section_videos (id,section_key,label,video_url,active,sort_order,created_at,updated_at) VALUES ('f4b9dd3b-ba89-4cc7-a90f-7caf0b4fd4a0','pricing','Pricing',NULL,1,40,'2026-04-25 18:57:38.997238+00','2026-04-25 18:57:38.997238+00');
INSERT INTO section_videos (id,section_key,label,video_url,active,sort_order,created_at,updated_at) VALUES ('e1dd6e4f-5ff0-4e32-8f5f-3a2fb7393e51','testimonials','Testimonials',NULL,1,50,'2026-04-25 18:57:38.997238+00','2026-04-25 18:57:38.997238+00');
INSERT INTO section_videos (id,section_key,label,video_url,active,sort_order,created_at,updated_at) VALUES ('00055ca3-e982-47d9-a4b2-5015f44d438f','booking','Booking Form',NULL,1,60,'2026-04-25 18:57:38.997238+00','2026-04-25 18:57:38.997238+00');
INSERT INTO section_videos (id,section_key,label,video_url,active,sort_order,created_at,updated_at) VALUES ('e05b855d-1bc6-41e5-a66b-073edb6b2853','footer','Footer',NULL,1,70,'2026-04-25 18:57:38.997238+00','2026-04-25 18:57:38.997238+00');
INSERT INTO bookings (id,customer_name,customer_email,customer_phone,booking_date,tour_id,quad_id,participants,notes,status,created_at,offer_id,offer_title,discount_percent,subtotal,total,category_id,route_from,route_to,quad_type) VALUES ('9bd8a5dd-67e7-4e05-82d6-5337e98c1e8f','AYMANE','aymane@gmail.com','0694784175','2026-04-25','8557bc4a-66e7-4965-9565-09d9a504b5c3','7b050998-ebd4-444f-861a-a9a9b3e7e695',2,'fefe','pending','2026-04-24 17:59:00.995347+00','db8817b3-65dd-4de9-9b7d-9487fd0236f0','Group Rates',15,170.00,144.50,NULL,NULL,NULL,NULL);
