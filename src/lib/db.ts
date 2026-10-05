import { supabase } from "@/integrations/supabase/client";

// Query builder that mirrors the subset of the Supabase API the app uses,
// but sends queries to the "turso-api" backend function (Turso database).
type Result<T = any> = { data: T | null; error: { message: string } | null };

class Query<T = any> implements PromiseLike<Result<T>> {
  private q: any;
  constructor(table: string) {
    this.q = { table, op: "select", columns: "*", filters: [] };
  }
  select(columns = "*") { if (this.q.op === "select") this.q.columns = columns; return this; }
  insert(values: any) { this.q.op = "insert"; this.q.values = values; return this; }
  update(values: any) { this.q.op = "update"; this.q.values = values; return this; }
  delete() { this.q.op = "delete"; return this; }
  private f(op: string, col: string, val: unknown) { this.q.filters.push({ col, op, val }); return this; }
  eq(c: string, v: unknown) { return this.f("eq", c, v); }
  neq(c: string, v: unknown) { return this.f("neq", c, v); }
  lt(c: string, v: unknown) { return this.f("lt", c, v); }
  lte(c: string, v: unknown) { return this.f("lte", c, v); }
  gt(c: string, v: unknown) { return this.f("gt", c, v); }
  gte(c: string, v: unknown) { return this.f("gte", c, v); }
  order(col: string, opts?: { ascending?: boolean }) { this.q.order = { col, ascending: opts?.ascending !== false }; return this; }
  limit(n: number) { this.q.limit = n; return this; }
  maybeSingle() { this.q.single = true; this.q.limit = 1; return this; }
  single() { return this.maybeSingle(); }

  private async run(): Promise<Result<T>> {
    const { data, error } = await supabase.functions.invoke("turso-api", { body: this.q });
    if (error) {
      let message = error.message;
      try { const body = await (error as any).context?.json?.(); if (body?.error?.message) message = body.error.message; } catch { /* ignore */ }
      return { data: null, error: { message } };
    }
    return data as Result<T>;
  }
  then<A = Result<T>, B = never>(ok?: ((v: Result<T>) => A | PromiseLike<A>) | null, err?: ((e: any) => B | PromiseLike<B>) | null) {
    return this.run().then(ok, err);
  }
}

export const db = { from: <T = any>(table: string) => new Query<T>(table) };
