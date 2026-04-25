import { Play } from "lucide-react";

type SectionVideoProps = {
  src?: string | null;
  label: string;
  className?: string;
};

const SectionVideo = ({ src, label, className = "" }: SectionVideoProps) => {
  if (!src) return null;

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-border bg-card shadow-card ${className}`}>
      <video
        src={src}
        className="aspect-video w-full object-cover"
        controls
        playsInline
        preload="metadata"
        aria-label={`${label} video`}
      />
      <div className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/70 px-3 py-1 text-xs uppercase tracking-wider text-primary backdrop-blur">
        <Play className="h-3.5 w-3.5" /> {label}
      </div>
    </div>
  );
};

export default SectionVideo;