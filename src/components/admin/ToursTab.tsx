import { db } from "@/lib/db";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Category = { id: string; name: string };
type Tour = { id: string; name: string; description: string | null; duration: string; difficulty: string; price: number; image_url: string | null; active: boolean; category_id: string | null; quad_type: string | null; route_from: string | null; route_to: string | null; distance_km: number | null; terrain: string | null; included_items: string[] | null };

const NO_CATEGORY = "__none__";
const empty = { name: "", description: "", duration: "2 hours", difficulty: "easy", price: 55, image_url: "", active: true, category_id: NO_CATEGORY, quad_type: "450cc ATV", route_from: "Agafay Base", route_to: "Desert Trail", distance_km: 12, terrain: "Stone desert", included_items: "Helmet & goggles, Local guide, Safety briefing" };
const schema = z.object({ name: z.string().trim().min(1).max(120), description: z.string().trim().max(500).optional(), duration: z.string().trim().min(1).max(80), difficulty: z.string().trim().min(1).max(40), price: z.coerce.number().min(0), image_url: z.string().trim().max(1000).optional(), active: z.boolean(), category_id: z.string(), quad_type: z.string().trim().max(80).optional(), route_from: z.string().trim().max(120).optional(), route_to: z.string().trim().max(120).optional(), distance_km: z.coerce.number().min(0).max(999).optional(), terrain: z.string().trim().max(120).optional(), included_items: z.string().trim().max(1000).optional() });

const ToursTab = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tour | null>(null);
  const [form, setForm] = useState<any>(empty);

  const load = async () => {
    const [{ data: tourData }, { data: categoryData }] = await Promise.all([
      db.from("tours").select("*").order("created_at", { ascending: false }),
      db.from("categories").select("id,name").order("sort_order", { ascending: true }),
    ]);
    setTours((tourData as any) || []);
    setCategories(((categoryData as unknown) as Category[]) || []);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (tour: Tour) => { setEditing(tour); setForm({ ...tour, category_id: tour.category_id || NO_CATEGORY, included_items: (tour.included_items || []).join(", ") }); setOpen(true); };

  const save = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message || "Check tour details"); return; }
    const payload = { ...parsed.data, description: parsed.data.description || null, image_url: parsed.data.image_url || null, category_id: parsed.data.category_id === NO_CATEGORY ? null : parsed.data.category_id, included_items: (parsed.data.included_items || "").split(",").map((item) => item.trim()).filter(Boolean) };
    const { error } = editing ? await db.from("tours").update(payload as any).eq("id", editing.id) : await db.from("tours").insert(payload as any);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Tour updated" : "Tour created");
    setOpen(false); load();
  };

  const remove = async (id: string) => { if (!confirm("Delete this tour?")) return; const { error } = await db.from("tours").delete().eq("id", id); if (error) { toast.error(error.message); return; } toast.success("Tour deleted"); load(); };

  return <div><div className="mb-6 flex items-center justify-between"><h2 className="font-display text-3xl tracking-wider">Tours & Detail Pages</h2><Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant="hero" onClick={openNew}><Plus /> Add Tour</Button></DialogTrigger><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{editing ? "Edit" : "New"} Tour</DialogTitle></DialogHeader><div className="space-y-4"><div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div><div><Label>Description</Label><Textarea rows={3} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div><div className="grid grid-cols-2 gap-4"><div><Label>Category</Label><Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={NO_CATEGORY}>No category</SelectItem>{categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent></Select></div><div><Label>Quad type</Label><Input value={form.quad_type || ""} onChange={(e) => setForm({ ...form, quad_type: e.target.value })} /></div></div><div className="grid grid-cols-2 gap-4"><div><Label>From</Label><Input value={form.route_from || ""} onChange={(e) => setForm({ ...form, route_from: e.target.value })} /></div><div><Label>To</Label><Input value={form.route_to || ""} onChange={(e) => setForm({ ...form, route_to: e.target.value })} /></div></div><div className="grid grid-cols-3 gap-4"><div><Label>Duration</Label><Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></div><div><Label>Distance km</Label><Input type="number" value={form.distance_km || 0} onChange={(e) => setForm({ ...form, distance_km: e.target.value })} /></div><div><Label>Price (€)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div></div><div className="grid grid-cols-2 gap-4"><div><Label>Difficulty</Label><Input value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} /></div><div><Label>Terrain</Label><Input value={form.terrain || ""} onChange={(e) => setForm({ ...form, terrain: e.target.value })} /></div></div><div><Label>Included items</Label><Input value={form.included_items || ""} onChange={(e) => setForm({ ...form, included_items: e.target.value })} /></div><div><Label>Image URL</Label><Input value={form.image_url || ""} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div><div className="flex items-center justify-between"><Label>Active</Label><Switch checked={form.active} onCheckedChange={(active) => setForm({ ...form, active })} /></div><Button variant="hero" className="w-full" onClick={save}>{editing ? "Update" : "Create"}</Button></div></DialogContent></Dialog></div><div className="overflow-hidden rounded-lg border border-border"><Table><TableHeader><TableRow><TableHead>Tour</TableHead><TableHead>Route</TableHead><TableHead>Quad</TableHead><TableHead>Price</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{tours.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No tours yet</TableCell></TableRow>}{tours.map((tour) => <TableRow key={tour.id}><TableCell className="font-medium">{tour.name}</TableCell><TableCell className="text-sm text-muted-foreground">{tour.route_from || "—"} → {tour.route_to || "—"}</TableCell><TableCell>{tour.quad_type || "—"}</TableCell><TableCell>€{Number(tour.price).toFixed(0)}</TableCell><TableCell className="text-right"><Button size="icon" variant="ghost" onClick={() => openEdit(tour)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => remove(tour.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell></TableRow>)}</TableBody></Table></div></div>;
};

export default ToursTab;