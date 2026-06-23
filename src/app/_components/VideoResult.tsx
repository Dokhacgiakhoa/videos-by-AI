"use client";

type Aspect = "9:16" | "1:1" | "16:9";

const aspectCls: Record<Aspect, string> = {
  "9:16": "aspect-[9/16] max-h-[70vh]",
  "1:1": "aspect-square max-w-md",
  "16:9": "aspect-video max-w-2xl",
};

export function VideoResult({ videoUrl, aspect }: { videoUrl: string; aspect: Aspect }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <h2 className="text-lg font-semibold">Video của bạn 🎉</h2>
      <video
        src={videoUrl}
        controls
        className={`w-full self-center rounded-xl bg-black ${aspectCls[aspect]}`}
      />
      <a
        href={videoUrl}
        download
        className="self-start rounded-xl bg-emerald-600 px-5 py-2 text-base font-semibold hover:bg-emerald-500"
      >
        ⬇ Tải video (.mp4)
      </a>
    </section>
  );
}
