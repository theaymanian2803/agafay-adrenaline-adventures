import { db } from "@/lib/db";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Category = { id: string; name: string; slug: string; description: string | null; active: boolean; sort_order: number };

const empty = { name: "", slug: "", description: "", active: true, sort_order: 0 };
const schema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
  description: z.string().trim().max(500).optional(),
  active: z.boolean(),
  sort_order: z.coerce.number().int().min(0).max(999),
});

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const CategoriesTab = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<any>(empty);

  const load = async () => {
    const { data } = await db.from("categories").select("*").order("sort_order", { ascending: true });
    setCategories(((data as unknown) as Category[]) || []);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (category: Category) => { setEditing(category); setForm(category); setOpen(true); };

  const save = async () => {
    const parsed = schema.safeParse({ ...form, slug: form.slug || slugify(form.name) });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message || "Check category details"); return; }
    const payload = { ...parsed.data, description: parsed.data.description || null };
    const { error } = editing
      ? await db.from("categories").update(payload).eq("id", editing.id)
      : await db.from("categories").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Category updated" : "Category created");
    setOpen(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    const { error } = await db.from("categories").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Category deleted"); load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-3xl tracking-wider">Categories</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="hero" onClick={openNew}><Plus /> Add Category</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} Category</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: editing ? form.slug : slugify(e.target.value) })} /></div>
              <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} /></div>
              <div><Label>Description</Label><Textarea rows={3} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Sort order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
                <div className="flex items-center justify-between pt-6"><Label>Active</Label><Switch checked={form.active} onCheckedChange={(active) => setForm({ ...form, active })} /></div>
              </div>
              <Button variant="hero" className="w-full" onClick={save}>{editing ? "Update" : "Create"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Slug</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {categories.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No categories yet</TableCell></TableRow>}
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                <TableCell><Badge variant={category.active ? "default" : "secondary"}>{category.active ? "Active" : "Paused"}</Badge></TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(category)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(category.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CategoriesTab;