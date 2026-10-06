import { createClient as createLibsql } from "npm:@libsql/client@0.14.0/web";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-lovable-aig-run-id",
  "Access-Control-Expose-Headers": "X-Lovable-AIG-Run-ID",
};
const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, ...extra, "Content-Type": "application/json" } });

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "tours", "quads"],
  properties: {
    summary: { type: "string" },
    tours: {
      type: "array",
      items: {
        type: "object", additionalProperties: false, required: ["id", "reason"],
        properties: { id: { type: "string" }, reason: { type: "string" } },
      },
    },
    quads: {
      type: "array",
      items: {
        type: "object", additionalProperties: false, required: ["id", "reason"],
        properties: { id: { type: "string" }, reason: { type: "string" } },
      },
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI is not configured." }, 500);
    const { groupSize, duration, experience, notes } = await req.json();
    const size = Math.min(30, Math.max(1, Number(groupSize) || 1));
    const dur = String(duration ?? "").slice(0, 40);
    const exp = String(experience ?? "").slice(0, 40);
    const extra = String(notes ?? "").slice(0, 500);

    const db = createLibsql({ url: Deno.env.get("TURSO_DATABASE_URL")!, authToken: Deno.env.get("TURSO_AUTH_TOKEN") });
    const tours = (await db.execute(
      "SELECT id,name,description,duration,difficulty,price,quad_type,route_from,route_to,distance_km,terrain FROM tours WHERE active=1",
    )).rows;
    const quads = (await db.execute(
      "SELECT id,name,engine_size,quad_type,capacity,transmission,hourly_rate,daily_rate,short_description FROM quads WHERE status='available'",
    )).rows;

    const runIdIn = req.headers.get("X-Lovable-AIG-Run-ID")?.trim();
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      signal: req.signal,
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
        ...(runIdIn ? { "X-Lovable-AIG-Run-ID": runIdIn } : {}),
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low", summary: "auto" },
        include: ["reasoning.encrypted_content"],
        text: { format: { type: "json_schema", name: "recommendation", strict: true, schema } },
        input: [
          {
            role: "system",
            content:
              "You are a friendly quad/ATV ride advisor for Agafay, Marrakech. Recommend 1-3 tours and 1-3 quads ONLY from the provided catalog, using their exact ids. Match difficulty to experience, duration to preference, and quad capacity/type to group size (beginners: automatic, smaller engines; kids or couples: 2-seaters). Reasons: one short sentence each. Summary: 2 sentences max. Reply in the user's language.",
          },
          {
            role: "user",
            content: JSON.stringify({ request: { groupSize: size, duration: dur, experience: exp, notes: extra }, tours, quads }),
          },
        ],
      }),
    });
    const runId = res.headers.get("X-Lovable-AIG-Run-ID") ?? "";
    const runHdr: Record<string, string> = runId ? { "X-Lovable-AIG-Run-ID": runId } : {};

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = body?.error?.message ?? body?.message ??
        (res.status === 429 ? "Too many requests, please try again shortly." :
          res.status === 402 ? "AI credits are exhausted." : "The ride advisor is unavailable right now.");
      return json({ error: msg }, res.status, runHdr);
    }

    // Read SSE stream
    const reader = res.body!.getReader();
    const dec = new TextDecoder();
    let buf = "", text = "", failure = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const ev = JSON.parse(data);
          if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
          else if (ev.type === "response.failed" || ev.type === "error")
            failure = ev.response?.error?.message ?? ev.message ?? "The AI request failed.";
          else if (ev.type === "response.refusal.delta") failure = "The advisor could not answer this request.";
        } catch { /* ignore */ }
      }
    }
    if (failure) return json({ error: failure }, 502, runHdr);
    if (!text) return json({ error: "The advisor returned no answer. Please try again." }, 502, runHdr);

    let parsed: { summary: string; tours: { id: string; reason: string }[]; quads: { id: string; reason: string }[] };
    try { parsed = JSON.parse(text); } catch { return json({ error: "The advisor reply could not be read." }, 502, runHdr); }

    const tourMap = new Map(tours.map((t) => [String(t.id), t]));
    const quadMap = new Map(quads.map((q) => [String(q.id), q]));
    return json({
      summary: parsed.summary,
      tours: parsed.tours.filter((t) => tourMap.has(t.id)).slice(0, 3).map((t) => ({ ...tourMap.get(t.id), reason: t.reason })),
      quads: parsed.quads.filter((q) => quadMap.has(q.id)).slice(0, 3).map((q) => ({ ...quadMap.get(q.id), reason: q.reason })),
    }, 200, runHdr);
  } catch (e) {
    if (req.signal.aborted) return new Response(null, { status: 499, headers: cors });
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
