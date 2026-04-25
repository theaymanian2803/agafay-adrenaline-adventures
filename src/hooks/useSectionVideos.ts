import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SectionVideo = {
  id: string;
  section_key: string;
  label: string;
  video_url: string | null;
  active: boolean;
  sort_order: number;
};

export const isDirectVideoUrl = (value: string) =>
  /^https?:\/\/[^\s<>"']+\.(mp4|webm)(\?[^\s<>"']*)?$/i.test(value.trim());

export const useSectionVideos = () => {
  const [videos, setVideos] = useState<Record<string, SectionVideo>>({});

  useEffect(() => {
    supabase
      .from("section_videos" as any)
      .select("id,section_key,label,video_url,active,sort_order")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        const mapped = ((data as SectionVideo[]) || []).reduce<Record<string, SectionVideo>>((acc, video) => {
          acc[video.section_key] = video;
          return acc;
        }, {});
        setVideos(mapped);
      });
  }, []);

  return videos;
};