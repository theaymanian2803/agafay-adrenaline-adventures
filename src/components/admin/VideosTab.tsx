import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { isDirectVideoUrl, type SectionVideo } from "@/hooks/useSectionVideos";

const videoSchema = z.string().trim().max(1000).optional().refine((value) => !value || isDirectVideoUrl(value), {
  message: "Use a direct https MP4 or WebM URL.",
});

const VideosTab = () => {
  const [videos, setVideos] = useState<SectionVideo[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("section_videos" as any)
      .select("id,section_key,label,video_url,active,sort_order")
      .order("sort_order", { ascending: true });
    if (error) {
      toast.error(error.message);
      return;
    }
    setVideos(((data as unknown) as SectionVideo[]) || []);
  };

  useEffect(() => { load(); }, []);

  const updateLocal = (id: string, patch: Partial<SectionVideo>) => {
    setVideos((current) => current.map((video) => video.id === id ? { ...video, ...patch } : video));
  };

  const save = async (video: SectionVideo) => {
    const parsed = videoSchema.safeParse(video.video_url || "");
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Invalid video URL");
      return;
    }

    setSavingId(video.id);
    const { error } = await supabase
      .from("section_videos" as any)
      .update({ video_url: parsed.data || null, active: video.active })
      .eq("id", video.id);
    setSavingId(null);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${video.label} video saved`);
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl tracking-wider">Homepage Videos</h2>
          <p className="mt-1 text-sm text-muted-foreground">Add direct MP4 or WebM URLs for each homepage section.</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Section</TableHead>
              <TableHead>Video URL</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {videos.length === 0 && (
              <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No video settings yet</TableCell></TableRow>
            )}
            {videos.map((video) => (
              <TableRow key={video.id}>
                <TableCell className="font-medium">{video.label}</TableCell>
                <TableCell>
                  <Label className="sr-only" htmlFor={`video-${video.id}`}>{video.label} video URL</Label>
                  <Input
                    id={`video-${video.id}`}
                    value={video.video_url || ""}
                    placeholder="https://example.com/video.mp4"
                    onChange={(event) => updateLocal(video.id, { video_url: event.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Switch checked={video.active} onCheckedChange={(active) => updateLocal(video.id, { active })} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outlineGlow" size="sm" onClick={() => save(video)} disabled={savingId === video.id}>
                    {savingId === video.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default VideosTab;