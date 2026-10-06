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

