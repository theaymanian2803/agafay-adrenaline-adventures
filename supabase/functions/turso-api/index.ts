import { createClient as createLibsql } from "npm:@libsql/client@0.14.0/web";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Whitelisted tables and columns. Anything else is rejected.
const SCHEMA: Record<string, string[]> = {
  categories: ["id", "name", "slug", "description", "active", "sort_order", "created_at", "updated_at"],
  tours: ["id", "name", "description", "duration", "difficulty", "price", "image_url", "active", "created_at", "category_id", "quad_type", "route_from", "route_to", "distance_km", "terrain", "included_items"],
  quads: ["id", "name", "engine_size", "image_url", "status", "hourly_rate", "daily_rate", "created_at", "updated_at", "quad_type", "capacity", "transmission", "short_description"],
  offers: ["id", "title", "description", "discount_percent", "starts_at", "ends_at", "active", "created_at"],
  section_videos: ["id", "section_key", "label", "video_url", "active", "sort_order", "created_at", "updated_at"],
  bookings: ["id", "customer_name", "customer_email", "customer_phone", "booking_date", "tour_id", "quad_id", "participants", "notes", "status", "created_at", "offer_id", "offer_title", "discount_percent", "subtotal", "total", "category_id", "route_from", "route_to", "quad_type"],
};
const BOOL_COLS = new Set(["active"]);
const JSON_COLS = new Set(["included_items"]);
const HAS_UPDATED_AT = new Set(["categories", "quads", "section_videos"]);
// Embedded relations: name -> [table, foreign key column on parent]
const RELATIONS: Record<string, [string, string]> = {
  tours: ["tours", "tour_id"],
  quads: ["quads", "quad_id"],
  categories: ["categories", "category_id"],
  offers: ["offers", "offer_id"],
};
// Public (non-admin) read access. null = no access.
const PUBLIC_READ: Record<string, string | null | true> = {
  categories: "active", tours: "active", offers: "active", section_videos: "active", quads: true, bookings: null,
};
const OPS: Record<string, string> = { eq: "=", neq: "!=", lt: "<", lte: "<=", gt: ">", gte: ">=" };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const toDb = (col: string, v: unknown) => {
  if (v === undefined) return null;
  if (BOOL_COLS.has(col)) return v ? 1 : 0;
  if (JSON_COLS.has(col)) return JSON.stringify(v ?? []);
  return v as any;
};
const fromDb = (row: Record<string, unknown>) => {
  const out: Record<string, unknown> = { ...row };
  for (const k of Object.keys(out)) {
    if (BOOL_COLS.has(k)) out[k] = !!out[k];
    if (JSON_COLS.has(k)) { try { out[k] = JSON.parse((out[k] as string) || "[]"); } catch { out[k] = []; } }
  }
  return out;
};

const parseSelect = (sel: string) => {
  const cols: string[] = [];
  const rels: { name: string; cols: string[] }[] = [];
  const re = /(\w+)\s*\(([^)]*)\)|(\*|\w+)/g;
  let m;
  while ((m = re.exec(sel || "*"))) {
    if (m[1]) rels.push({ name: m[1], cols: m[2].split(",").map((c) => c.trim()).filter(Boolean) });
    else cols.push(m[3]);
  }
  return { cols: cols.length ? cols : ["*"], rels };
};

const checkCols = (table: string, cols: string[]) => {
  for (const c of cols) if (c !== "*" && !SCHEMA[table].includes(c)) throw new Error(`Unknown column ${table}.${c}`);
};

const validateBooking = (b: Record<string, any>) => {
  const today = new Date().toISOString().split("T")[0];
  const name = String(b.customer_name ?? ""), email = String(b.customer_email ?? "");
  const p = Number(b.participants ?? 1), d = Number(b.discount_percent ?? 0);
  if (name.length < 1 || name.length > 120) throw new Error("Invalid name");
  if (email.length < 5 || email.length > 200 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Invalid email");
  if (!Number.isInteger(p) || p < 1 || p > 30) throw new Error("Invalid participants");
  if (!b.booking_date || String(b.booking_date) < today) throw new Error("Invalid date");
  if (d < 0 || d > 100) throw new Error("Invalid discount");
  if (Number(b.subtotal ?? 0) < 0 || Number(b.total ?? 0) < 0) throw new Error("Invalid totals");
  b.status = "pending";
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const url = Deno.env.get("TURSO_DATABASE_URL"), token = Deno.env.get("TURSO_AUTH_TOKEN");
    if (!url) return json({ data: null, error: { message: "Database not configured yet" } });
    const db = createLibsql({ url, authToken: token });

    // Admin check via existing sign-in
    let isAdmin = false;
    const auth = req.headers.get("Authorization");
    if (auth?.startsWith("Bearer ")) {
      const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: u } = await sb.auth.getUser(auth.slice(7));
      if (u?.user) {
        const { data: r } = await sb.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
        isAdmin = !!r;
      }
    }

    const q = await req.json();
    if (q.op === "__setup") { await db.executeMultiple(SETUP_SQL); return json({ data: "ok", error: null }); }
    const table: string = q.table;
    if (!SCHEMA[table]) throw new Error("Unknown table");
    const op: string = q.op;
    const filters: { col: string; op: string; val: unknown }[] = q.filters || [];
    checkCols(table, filters.map((f) => f.col));
    const where: string[] = [];
    const args: any[] = [];
    for (const f of filters) {
      if (!OPS[f.op]) throw new Error("Bad filter");
      where.push(`"${f.col}" ${OPS[f.op]} ?`);
      args.push(toDb(f.col, f.val));
    }

    if (op === "select") {
      const rule = PUBLIC_READ[table];
      if (!isAdmin) {
        if (rule === null) return json({ data: null, error: { message: "Not allowed" } }, 403);
        if (typeof rule === "string") where.push(`"${rule}" = 1`);
      }
      const { cols, rels } = parseSelect(q.columns);
      checkCols(table, cols);
      let sql = `SELECT ${cols.includes("*") ? "*" : cols.map((c) => `"${c}"`).join(",")} FROM "${table}"`;
      if (where.length) sql += ` WHERE ${where.join(" AND ")}`;
      if (q.order) { checkCols(table, [q.order.col]); sql += ` ORDER BY "${q.order.col}" ${q.order.ascending === false ? "DESC" : "ASC"}`; }
      if (q.limit) sql += ` LIMIT ${Math.min(Number(q.limit) || 1, 1000)}`;
      const res = await db.execute({ sql, args });
      const rows = res.rows.map((r: any) => fromDb({ ...r }));
      for (const rel of rels) {
        const def = RELATIONS[rel.name];
        if (!def || !SCHEMA[table].includes(def[1])) throw new Error("Unknown relation");
        const [rt, fk] = def;
        checkCols(rt, rel.cols);
        if (!isAdmin && PUBLIC_READ[rt] === null) throw new Error("Not allowed");
        const ids = [...new Set(rows.map((r) => r[fk]).filter(Boolean))];
        const map: Record<string, unknown> = {};
        if (ids.length) {
          const rc = rel.cols.includes("*") || !rel.cols.length ? "*" : [...new Set(["id", ...rel.cols])].map((c) => `"${c}"`).join(",");
          const rr = await db.execute({ sql: `SELECT ${rc} FROM "${rt}" WHERE id IN (${ids.map(() => "?").join(",")})`, args: ids as any[] });
          for (const x of rr.rows as any[]) map[x.id] = fromDb({ ...x });
        }
        for (const r of rows) r[rel.name] = r[fk] ? map[r[fk] as string] ?? null : null;
      }
      return json({ data: q.single ? rows[0] ?? null : rows, error: null });
    }

    if (op === "insert") {
      const list: Record<string, any>[] = Array.isArray(q.values) ? q.values : [q.values];
      if (!isAdmin && table !== "bookings") return json({ data: null, error: { message: "Not allowed" } }, 403);
      const out = [];
      for (const raw of list) {
        const v = { ...raw };
        if (table === "bookings" && !isAdmin) validateBooking(v);
        v.id ??= crypto.randomUUID();
        v.created_at ??= new Date().toISOString();
        if (HAS_UPDATED_AT.has(table)) v.updated_at = new Date().toISOString();
        const cols = Object.keys(v);
        checkCols(table, cols);
        await db.execute({
          sql: `INSERT INTO "${table}" (${cols.map((c) => `"${c}"`).join(",")}) VALUES (${cols.map(() => "?").join(",")})`,
          args: cols.map((c) => toDb(c, v[c])),
        });
        out.push(v);
      }
      return json({ data: out, error: null });
    }

    if (op === "update" || op === "delete") {
      if (!isAdmin) return json({ data: null, error: { message: "Not allowed" } }, 403);
      if (!where.length) throw new Error("Filter required");
      if (op === "delete") {
        await db.execute({ sql: `DELETE FROM "${table}" WHERE ${where.join(" AND ")}`, args });
        return json({ data: null, error: null });
      }
      const v = { ...q.values };
      delete v.id;
      if (HAS_UPDATED_AT.has(table)) v.updated_at = new Date().toISOString();
      const cols = Object.keys(v);
      checkCols(table, cols);
      if (!cols.length) return json({ data: null, error: null });
      await db.execute({
        sql: `UPDATE "${table}" SET ${cols.map((c) => `"${c}" = ?`).join(",")} WHERE ${where.join(" AND ")}`,
        args: [...cols.map((c) => toDb(c, v[c])), ...args],
      });
      return json({ data: null, error: null });
    }

    throw new Error("Unknown operation");
  } catch (e) {
    return json({ data: null, error: { message: (e as Error).message } }, 400);
  }
});

const SETUP_SQL = "-- Turso setup: creates tables and copies existing data.\n-- Run with: turso db shell <your-db-name> < turso/setup.sql\n\nCREATE TABLE IF NOT EXISTS categories (\n  id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, description TEXT,\n  active INTEGER NOT NULL DEFAULT 1, sort_order INTEGER NOT NULL DEFAULT 0,\n  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))\n);\nCREATE TABLE IF NOT EXISTS tours (\n  id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, duration TEXT NOT NULL,\n  difficulty TEXT NOT NULL DEFAULT 'easy', price REAL NOT NULL DEFAULT 0, image_url TEXT,\n  active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime('now')),\n  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL, quad_type TEXT, route_from TEXT, route_to TEXT,\n  distance_km REAL, terrain TEXT, included_items TEXT NOT NULL DEFAULT '[]'\n);\nCREATE TABLE IF NOT EXISTS quads (\n  id TEXT PRIMARY KEY, name TEXT NOT NULL, engine_size INTEGER NOT NULL, image_url TEXT,\n  status TEXT NOT NULL DEFAULT 'available', hourly_rate REAL NOT NULL DEFAULT 0, daily_rate REAL NOT NULL DEFAULT 0,\n  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')),\n  quad_type TEXT, capacity INTEGER NOT NULL DEFAULT 1, transmission TEXT, short_description TEXT\n);\nCREATE TABLE IF NOT EXISTS offers (\n  id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, discount_percent INTEGER NOT NULL DEFAULT 0,\n  starts_at TEXT NOT NULL, ends_at TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1,\n  created_at TEXT NOT NULL DEFAULT (datetime('now'))\n);\nCREATE TABLE IF NOT EXISTS section_videos (\n  id TEXT PRIMARY KEY, section_key TEXT NOT NULL UNIQUE, label TEXT NOT NULL, video_url TEXT,\n  active INTEGER NOT NULL DEFAULT 1, sort_order INTEGER NOT NULL DEFAULT 0,\n  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))\n);\nCREATE TABLE IF NOT EXISTS bookings (\n  id TEXT PRIMARY KEY, customer_name TEXT NOT NULL, customer_email TEXT NOT NULL, customer_phone TEXT,\n  booking_date TEXT NOT NULL, tour_id TEXT REFERENCES tours(id) ON DELETE SET NULL,\n  quad_id TEXT REFERENCES quads(id) ON DELETE SET NULL, participants INTEGER NOT NULL DEFAULT 1, notes TEXT,\n  status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL DEFAULT (datetime('now')),\n  offer_id TEXT REFERENCES offers(id) ON DELETE SET NULL, offer_title TEXT, discount_percent INTEGER NOT NULL DEFAULT 0,\n  subtotal REAL NOT NULL DEFAULT 0, total REAL NOT NULL DEFAULT 0,\n  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL, route_from TEXT, route_to TEXT, quad_type TEXT\n);\n\n-- Existing data\nINSERT INTO categories VALUES ('17ed1054-fe5b-413a-ad76-aca14c0d80c8','Sunset Rides','sunset-rides','Golden-hour quad routes across Agafay desert viewpoints.',1,10,'2026-04-25 19:02:51.896095+00','2026-04-25 19:02:51.896095+00');\nINSERT INTO categories VALUES ('8a454b0d-3b3e-4271-97c7-130c219dbdc7','Family Friendly','family-friendly','Accessible quad experiences with calmer routes and guide support.',1,20,'2026-04-25 19:02:51.896095+00','2026-04-25 19:02:51.896095+00');\nINSERT INTO categories VALUES ('720d42b5-a289-4d3d-94ff-c4b9342e51c1','Extreme Adventure','extreme-adventure','Higher-adrenaline routes with rocky tracks and longer distances.',1,30,'2026-04-25 19:02:51.896095+00','2026-04-25 19:02:51.896095+00');\nINSERT INTO tours (id,name,description,duration,difficulty,price,image_url,active,created_at,category_id,quad_type,route_from,route_to,distance_km,terrain,included_items) VALUES ('1899b84a-9d9c-40e4-a1ef-8604f8b28723','Agafay Sunset Drive','Chase the golden hour across the rolling stone desert with our most iconic ride.','2 hours','easy',55.00,'/src/assets/tour-sunset.jpg',1,'2026-04-24 17:46:59.789987+00',NULL,NULL,NULL,NULL,NULL,NULL,'[]');\nINSERT INTO tours (id,name,description,duration,difficulty,price,image_url,active,created_at,category_id,quad_type,route_from,route_to,distance_km,terrain,included_items) VALUES ('8557bc4a-66e7-4965-9565-09d9a504b5c3','Extreme Palmeraie Track','Punch through palm groves and dirt tracks. High-octane, full throttle.','3 hours','moderate',85.00,'/src/assets/tour-palmeraie.jpg',1,'2026-04-24 17:46:59.789987+00',NULL,NULL,NULL,NULL,NULL,NULL,'[]');\nINSERT INTO tours (id,name,description,duration,difficulty,price,image_url,active,created_at,category_id,quad_type,route_from,route_to,distance_km,terrain,included_items) VALUES ('1a40e7e2-ef50-42fc-98fa-4a925eb94bab','Atlas Mountain Footprints','Ride to the foothills of the Atlas \u2014 rocky terrain, panoramic views.','Half day','extreme',140.00,'/src/assets/tour-atlas.jpg',1,'2026-04-24 17:46:59.789987+00',NULL,NULL,NULL,NULL,NULL,NULL,'[]');\nINSERT INTO quads (id,name,engine_size,image_url,status,hourly_rate,daily_rate,created_at,updated_at,quad_type,capacity,transmission,short_description) VALUES ('7c07ec6d-a448-4dc1-a172-c86b5096ff78','Yamaha Raptor 700',700,'/src/assets/tour-sunset.jpg','available',45.00,260.00,'2026-04-24 17:46:59.789987+00','2026-04-24 17:46:59.789987+00',NULL,1,NULL,NULL);\nINSERT INTO quads (id,name,engine_size,image_url,status,hourly_rate,daily_rate,created_at,updated_at,quad_type,capacity,transmission,short_description) VALUES ('7b050998-ebd4-444f-861a-a9a9b3e7e695','Honda TRX 450',450,'/src/assets/tour-palmeraie.jpg','available',35.00,200.00,'2026-04-24 17:46:59.789987+00','2026-04-24 17:46:59.789987+00',NULL,1,NULL,NULL);\nINSERT INTO quads (id,name,engine_size,image_url,status,hourly_rate,daily_rate,created_at,updated_at,quad_type,capacity,transmission,short_description) VALUES ('820c0d08-8c30-44d4-aa99-a217c2454fcb','Polaris Sportsman 850',850,'/src/assets/tour-atlas.jpg','maintenance',55.00,310.00,'2026-04-24 17:46:59.789987+00','2026-04-24 17:46:59.789987+00',NULL,1,NULL,NULL);\nINSERT INTO quads (id,name,engine_size,image_url,status,hourly_rate,daily_rate,created_at,updated_at,quad_type,capacity,transmission,short_description) VALUES ('1ea33cc0-e708-4122-ba59-d28feaf97ba6','Quad Biking',450,'https://gsvebtazjexkgplogtif.supabase.co/storage/v1/object/public/quad-images/1777053568136-Screenshot_2026-04-24_185901.png','available',10.00,200.00,'2026-04-24 18:00:07.633251+00','2026-04-24 18:00:07.633251+00',NULL,1,NULL,NULL);\nINSERT INTO offers (id,title,description,discount_percent,starts_at,ends_at,active,created_at) VALUES ('f62fdb78-e84d-466a-bf05-6b6bce6e5c4c','Marrakech Summer Discount','Beat the heat \u2014 20% off all sunset tours.',20,'2026-04-24','2026-06-23',1,'2026-04-24 17:46:59.789987+00');\nINSERT INTO offers (id,title,description,discount_percent,starts_at,ends_at,active,created_at) VALUES ('db8817b3-65dd-4de9-9b7d-9487fd0236f0','Group Rates','Book 4 or more riders, get 15% off.',15,'2026-04-24','2027-04-24',1,'2026-04-24 17:46:59.789987+00');\nINSERT INTO section_videos (id,section_key,label,video_url,active,sort_order,created_at,updated_at) VALUES ('a1cc5941-4f96-4e64-8786-5bc2f40a3a95','hero','Hero','https://pub-3fe2b2a234a04507951dc3d5646b7a33.r2.dev/174882-852541116.mp4',1,10,'2026-04-25 18:57:38.997238+00','2026-04-25 19:42:35.249128+00');\nINSERT INTO section_videos (id,section_key,label,video_url,active,sort_order,created_at,updated_at) VALUES ('5ee1e7fe-0f59-4341-9ba1-a891d6936e98','highlights','Highlights',NULL,1,20,'2026-04-25 18:57:38.997238+00','2026-04-25 19:33:17.494042+00');\nINSERT INTO section_videos (id,section_key,label,video_url,active,sort_order,created_at,updated_at) VALUES ('d1d1344c-834c-4323-86db-4c35428be659','tours','Tours',NULL,1,30,'2026-04-25 18:57:38.997238+00','2026-04-25 18:57:38.997238+00');\nINSERT INTO section_videos (id,section_key,label,video_url,active,sort_order,created_at,updated_at) VALUES ('f4b9dd3b-ba89-4cc7-a90f-7caf0b4fd4a0','pricing','Pricing',NULL,1,40,'2026-04-25 18:57:38.997238+00','2026-04-25 18:57:38.997238+00');\nINSERT INTO section_videos (id,section_key,label,video_url,active,sort_order,created_at,updated_at) VALUES ('e1dd6e4f-5ff0-4e32-8f5f-3a2fb7393e51','testimonials','Testimonials',NULL,1,50,'2026-04-25 18:57:38.997238+00','2026-04-25 18:57:38.997238+00');\nINSERT INTO section_videos (id,section_key,label,video_url,active,sort_order,created_at,updated_at) VALUES ('00055ca3-e982-47d9-a4b2-5015f44d438f','booking','Booking Form',NULL,1,60,'2026-04-25 18:57:38.997238+00','2026-04-25 18:57:38.997238+00');\nINSERT INTO section_videos (id,section_key,label,video_url,active,sort_order,created_at,updated_at) VALUES ('e05b855d-1bc6-41e5-a66b-073edb6b2853','footer','Footer',NULL,1,70,'2026-04-25 18:57:38.997238+00','2026-04-25 18:57:38.997238+00');\nINSERT INTO bookings (id,customer_name,customer_email,customer_phone,booking_date,tour_id,quad_id,participants,notes,status,created_at,offer_id,offer_title,discount_percent,subtotal,total,category_id,route_from,route_to,quad_type) VALUES ('9bd8a5dd-67e7-4e05-82d6-5337e98c1e8f','AYMANE','aymane@gmail.com','0694784175','2026-04-25','8557bc4a-66e7-4965-9565-09d9a504b5c3','7b050998-ebd4-444f-861a-a9a9b3e7e695',2,'fefe','pending','2026-04-24 17:59:00.995347+00','db8817b3-65dd-4de9-9b7d-9487fd0236f0','Group Rates',15,170.00,144.50,NULL,NULL,NULL,NULL);\n";
