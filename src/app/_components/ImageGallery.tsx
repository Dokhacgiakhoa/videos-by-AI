"use client";

type PostRatio = "1:1" | "4:5" | "9:16" | "2:1" | "16:9";

interface PostImage {
  url: string;
  headline?: string;
  ratio?: PostRatio;
}

/** Tỉ lệ → giá trị CSS aspect-ratio (mỗi ảnh trong album có thể khác nhau). */
const RATIO_CSS: Record<PostRatio, string> = {
  "1:1": "1 / 1",
  "4:5": "4 / 5",
  "9:16": "9 / 16",
  "2:1": "2 / 1",
  "16:9": "16 / 9",
};

export function ImageGallery({ images }: { images: PostImage[] }) {
  if (images.length === 0) return null;

  // Tải lần lượt từng ảnh PNG (KHÔNG nén zip).
  async function downloadAll() {
    for (let i = 0; i < images.length; i++) {
      const a = document.createElement("a");
      a.href = images[i].url;
      a.download = `anh_${i + 1}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      await new Promise((r) => setTimeout(r, 350)); // tránh trình duyệt chặn tải hàng loạt
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Bộ ảnh của bạn 🎉 ({images.length})</h2>
        <button
          type="button"
          onClick={downloadAll}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-base font-semibold hover:bg-emerald-500"
        >
          ⬇ Tải tất cả (PNG)
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((img, i) => (
          <a
            key={i}
            href={img.url}
            download
            title={img.headline || `Ảnh ${i + 1}`}
            className="group relative overflow-hidden rounded-lg border border-zinc-700 self-start"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.headline || `Ảnh ${i + 1}`}
              style={{ aspectRatio: RATIO_CSS[img.ratio ?? "4:5"] }}
              className="w-full object-cover"
            />
            <span className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-center text-base text-white opacity-0 transition-opacity group-hover:opacity-100">
              {img.ratio ?? ""} · Tải ảnh {i + 1}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
