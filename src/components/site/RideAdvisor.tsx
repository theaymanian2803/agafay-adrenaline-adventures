import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Rec = { id: string; name: string; reason: string; [k: string]: unknown };
type Result = { summary: string; tours: Rec[]; quads: Rec[] };

const RideAdvisor = () => {
  const [groupSize, setGroupSize] = useState(2);
  const [duration, setDuration] = useState("Half-day");
  const [experience, setExperience] = useState("Beginner");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(""); setResult(null);
    const { data, error } = await supabase.functions.invoke("ride-advisor", {
      body: { groupSize, duration, experience, notes },
    });
    setLoading(false);
    if (error) {
      let msg = "The ride advisor is unavailable right now.";
      try { const b = await (error as { context?: Response }).context?.json(); if (b?.error) msg = b.error; } catch { /* */ }
      setError(msg); return;
    }
    if (data?.error) { setError(data.error); return; }
    setResult(data);
  };

  return (
    <section id="advisor" className="py-24 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <p className="text-primary uppercase tracking-[0.3em] text-sm mb-3 flex items-center justify-center gap-2"><Sparkles className="h-4 w-4" /> AI Ride Advisor</p>
          <h2 className="font-display text-5xl md:text-7xl">Find your perfect ride</h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">Tell us about your group and we'll match you with the right tour and quad.</p>
        </motion.div>

        <form onSubmit={submit} className="grid md:grid-cols-3 gap-4 bg-card border border-border rounded-2xl p-6">
          <label className="space-y-2 text-sm">
            <span className="text-muted-foreground">Group size</span>
            <Input type="number" min={1} max={30} value={groupSize} onChange={(e) => setGroupSize(Number(e.target.value))} />
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-muted-foreground">Ride duration</span>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["1 hour", "2 hours", "Half-day", "Full-day"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-muted-foreground">Experience level</span>
            <Select value={experience} onValueChange={setExperience}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Beginner", "Intermediate", "Expert"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>
          <Textarea className="md:col-span-3" placeholder="Anything else? (kids, sunset, photos, thrill level...)" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
          <Button type="submit" disabled={loading} className="md:col-span-3 h-12 font-display text-xl tracking-wider">
            {loading ? <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Finding your ride...</> : "Get recommendations"}
          </Button>
        </form>

        {error && <p className="mt-6 text-center text-destructive">{error}</p>}

        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-10 space-y-8">
            <p className="text-lg text-center max-w-3xl mx-auto">{result.summary}</p>
            {result.tours.length > 0 && (
              <div>
                <h3 className="font-display text-3xl mb-4 text-primary">Recommended tours</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {result.tours.map((t) => (
                    <Link key={t.id} to={`/tours/${t.id}`} className="block bg-card border border-border rounded-xl p-5 hover:border-primary transition-colors">
                      <h4 className="font-display text-2xl">{t.name}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{String(t.duration ?? "")} · {String(t.difficulty ?? "")} · from {String(t.price ?? "")}</p>
                      <p className="text-sm">{t.reason}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {result.quads.length > 0 && (
              <div>
                <h3 className="font-display text-3xl mb-4 text-primary">Suggested quads</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {result.quads.map((q) => (
                    <div key={q.id} className="bg-card border border-border rounded-xl p-5">
                      <h4 className="font-display text-2xl">{q.name}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{String(q.engine_size ?? "")}cc · seats {String(q.capacity ?? "")}</p>
                      <p className="text-sm">{q.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="text-center">
              <Button asChild size="lg"><a href="#book">Book now</a></Button>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default RideAdvisor;
