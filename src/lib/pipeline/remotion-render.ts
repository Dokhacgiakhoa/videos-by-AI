import os from "os";
import path from "path";
import fs from "fs";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition, makeCancelSignal } from "@remotion/renderer";
import type { Card, ArticlePostProps, BrandConfig } from "../../remotion/types";
import { videoDims, postDims, type AspectRatio, type PostRatio } from "./aspect";

const FPS = 30;

/** Số luồng render: nửa số core (chừa CPU cho hệ thống, giảm rủi ro quá tải). */
function renderConcurrency(): number {
  return Math.max(2, Math.floor(os.cpus().length / 2));
}

let _cachedBundle: string | null = null;

/** Bundle Remotion 1 lần, tái dùng (bundle rất chậm). */
async function getBundle(onProgress?: (m: string) => void): Promise<string> {
  if (_cachedBundle && fs.existsSync(_cachedBundle)) return _cachedBundle;
  onProgress?.("Đang bundle Remotion (lần đầu hơi lâu)...");
  const entryPoint = path.join(process.cwd(), "src", "remotion", "index.ts");
  _cachedBundle = await bundle({
    entryPoint,
    publicDir: path.join(process.cwd(), "public"),
  });
  return _cachedBundle;
}

export interface RenderCardVideoOptions {
  cards: Card[];
  audioSrc?: string;
  bgMusic?: string;
  brandText?: string;
  aspectRatio?: AspectRatio;
  jobId: string;
  signal?: AbortSignal;
  brand?: { logoUrl: string; palette: Record<string, string> };
  onProgress?: (message: string) => void;
}

export async function renderCardVideo(opts: RenderCardVideoOptions): Promise<string> {
  const { cards, audioSrc, bgMusic, brandText = "AI91", aspectRatio = "9:16", jobId, signal, brand, onProgress } = opts;

  const videosDir = path.join(process.cwd(), "public", "assets", "videos");
  fs.mkdirSync(videosDir, { recursive: true });
  const outputLocation = path.join(videosDir, `${jobId}.mp4`);

  const { width, height } = videoDims(aspectRatio);
  const inputProps: Record<string, unknown> = { brandText, cards, audioSrc, bgMusic, width, height, brand };

  const bundleLocation = await getBundle(onProgress);

  onProgress?.("Đang phân tích composition...");
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "Ai91Video",
    inputProps,
  });

  const totalSec = Math.round(composition.durationInFrames / FPS);
  if (totalSec > 120) {
    onProgress?.(`Video dài ~${Math.round(totalSec / 60)} phút — render CPU có thể mất 10–30 phút, vui lòng chờ...`);
  }
  onProgress?.(`Đang render video ${width}x${height} (${composition.durationInFrames} frames)...`);

  const { cancelSignal, cancel } = makeCancelSignal();
  const onAbort = () => cancel();
  if (signal) {
    if (signal.aborted) cancel();
    else signal.addEventListener("abort", onAbort, { once: true });
  }

  try {
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: "h264",
      outputLocation,
      inputProps,
      concurrency: renderConcurrency(),
      x264Preset: "veryfast",
      crf: 23,
      cancelSignal,
      onProgress: ({ progress }) => {
        const pct = Math.round(progress * 100);
        if (pct % 10 === 0) onProgress?.(`Render: ${pct}%`);
      },
    });
  } finally {
    signal?.removeEventListener("abort", onAbort);
  }

  return `/assets/videos/${jobId}.mp4`;
}

export interface ArticleSlideInput {
  headline: string;
  summary?: string;
  source?: string;
  date?: string;
  imageSrc: string; // đường dẫn public (vd /assets/images/x.png)
  eyebrow?: string;
  ratio: PostRatio; // tỉ lệ RIÊNG của slide này
}

/**
 * Render 1 BỘ ảnh post tĩnh (renderStill mỗi slide, mỗi slide 1 tỉ lệ riêng).
 * Bundle 1 lần cho cả bộ.
 * @returns mảng đường dẫn public của ảnh PNG.
 */
export async function renderArticlePostBatch(
  slides: ArticleSlideInput[],
  opts: { jobId: string; brandText?: string; brand?: BrandConfig; signal?: AbortSignal; onProgress?: (m: string) => void },
): Promise<string[]> {
  const { jobId, brandText = "AI91", brand, signal, onProgress } = opts;
  const imagesDir = path.join(process.cwd(), "public", "assets", "images");
  fs.mkdirSync(imagesDir, { recursive: true });

  const bundleLocation = await getBundle(onProgress);

  const outUrls: string[] = [];
  for (let i = 0; i < slides.length; i++) {
    signal?.throwIfAborted();
    const s = slides[i];
    const { width, height } = postDims(s.ratio);
    onProgress?.(`Đang dựng ảnh post ${i + 1}/${slides.length} (${s.ratio})...`);
    const props: Record<string, unknown> = {
      ...s,
      width,
      height,
      brandText,
      brand,
      // ảnh: bỏ tiền tố / để Remotion staticFile resolve trong public
      imageSrc: s.imageSrc.replace(/^\//, ""),
    } satisfies Partial<ArticlePostProps> & Record<string, unknown>;

    const composition = await selectComposition({ serveUrl: bundleLocation, id: "ArticlePost", inputProps: props });
    const outName = `${jobId}_post_${i}.png`;
    const outAbs = path.join(imagesDir, outName);
    const { cancelSignal, cancel } = makeCancelSignal();
    const onAbort = () => cancel();
    if (signal) {
      if (signal.aborted) cancel();
      else signal.addEventListener("abort", onAbort, { once: true });
    }
    try {
      await renderStill({
        composition,
        serveUrl: bundleLocation,
        output: outAbs,
        inputProps: props,
        imageFormat: "png",
        overwrite: true,
        cancelSignal,
      });
    } finally {
      signal?.removeEventListener("abort", onAbort);
    }
    outUrls.push(`/assets/images/${outName}`);
  }
  return outUrls;
}
