"use client";

type Aspect = "9:16" | "1:1" | "16:9";

interface PostImage {
  url: string;
  headline?: string;
}

const aspectCls: Record<Aspect, string> = {
  "9:16": "aspect-[9/16]",
  "1:1": "aspect-square",
  "16:9": "aspect-video",
};

const gridCls: Record<Aspect, string> = {
  "9:16": "grid-cols-2 sm:grid-cols-3",
  "1:1": "grid-cols-2 sm:grid-cols-3",
  "16:9": "grid-cols-1 sm:grid-cols-2",
};

export function ImageGallery({
  images,
  zipUrl,
  aspect,
}: {
  images: PostImage[];
  zipUrl: string;
  aspect: Aspect;
}) {
  if (images.length === 0) return null;
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Bộ ảnh của bạn 🎉 ({images.length})</h2>
        {zipUrl && (
          <a
            href={zipUrl}
            download
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-500"
          >
            ⬇ Tải tất cả (.zip)
          </a>
        )}
      </div>
      <div className={`grid gap-3 ${gridCls[aspect]}`}>
        {images.map((img, i) => (
          <a
            key={i}
            href={img.url}
            download
            title={img.headline || `Ảnh ${i + 1}`}
            className="group relative overflow-hidden rounded-lg border border-zinc-700"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.headline || `Ảnh ${i + 1}`} className={`w-full object-cover ${aspectCls[aspect]}`} />
            <span className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-center text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
              Tải ảnh {i + 1}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
