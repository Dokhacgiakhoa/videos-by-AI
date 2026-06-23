import fs from "fs";
import path from "path";

/**
 * Lấy ẢNH CÓ SẴN trên web (KHÔNG generate AI) cho ảnh post bài báo:
 *  - `fetchOgImage`  : moi ảnh đại diện (og:image) từ chính bài báo.
 *  - `searchWebImage`: dự phòng — tìm ảnh qua DuckDuckGo (không cần API key).
 *  - `downloadImage` : tải ảnh về public/assets/images.
 *  - `acquireSlideImage`: gộp 3 bước, ưu tiên og:image → fallback search.
 *
 * Mọi nguồn đều miễn phí, không cần đăng nhập. DuckDuckGo dùng endpoint không
 * chính thức (vqd token) → cô lập trong `searchWebImage` để dễ thay thế sau.
 */

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/** Tải HTML của 1 trang (follow redirect — vd link Google News). Trả null nếu lỗi. */
async function fetchHtml(url: string, signal?: AbortSignal): Promise<{ html: string; finalUrl: string } | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": BROWSER_UA, Accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
      signal: signal ?? AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    return { html, finalUrl: res.url || url };
  } catch {
    return null;
  }
}

/** Rút URL ảnh từ thẻ meta og:image / twitter:image trong HTML. */
function extractMetaImage(html: string): string | null {
  const patterns = [
    /<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image(?::src)?)["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image(?::src)?)["']/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

/** Moi og:image từ 1 bài báo. Trả URL tuyệt đối hoặc null. */
export async function fetchOgImage(articleUrl: string, signal?: AbortSignal): Promise<string | null> {
  if (!articleUrl) return null;
  const page = await fetchHtml(articleUrl, signal);
  if (!page) return null;

  // Bỏ qua trang chuyển hướng của Google News vì nó chứa logo rác ("GE")
  if (
    page.finalUrl.includes("news.google.com") ||
    page.html.includes("<title>Google Tin tức</title>") ||
    page.html.includes("<title>Google News</title>")
  ) {
    return null;
  }

  const raw = extractMetaImage(page.html);
  if (!raw) return null;
  try {
    // Resolve URL tương đối theo trang gốc (sau redirect).
    return new URL(raw, page.finalUrl).toString();
  } catch {
    return raw.startsWith("http") ? raw : null;
  }
}

/** Lấy vqd token cần cho endpoint ảnh của DuckDuckGo. */
async function ddgVqd(query: string, signal?: AbortSignal): Promise<string | null> {
  try {
    const res = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&iar=images&iax=images&ia=images`, {
      headers: { "User-Agent": BROWSER_UA },
      signal: signal ?? AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(/vqd=["']?([\d-]+)["']?/) ?? html.match(/vqd=([\d-]+)&/);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

/** Tìm ảnh web qua DuckDuckGo (dự phòng). Trả URL ảnh đầu hợp lệ hoặc null. */
export async function searchWebImage(query: string, signal?: AbortSignal): Promise<string | null> {
  const vqd = await ddgVqd(query, signal);
  if (!vqd) return null;
  try {
    const url =
      `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}` +
      `&vqd=${vqd}&f=,,,&p=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": BROWSER_UA, Referer: "https://duckduckgo.com/", Accept: "application/json" },
      signal: signal ?? AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { results?: { image?: string }[] };
    const first = data.results?.find((r) => typeof r.image === "string" && r.image.startsWith("http"));
    return first?.image ?? null;
  } catch {
    return null;
  }
}

/** Tải ảnh từ URL về public/assets/images. Trả đường dẫn public hoặc null nếu hỏng. */
export async function downloadImage(url: string, filename: string, signal?: AbortSignal): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": BROWSER_UA, Accept: "image/*" },
      redirect: "follow",
      signal: signal ?? AbortSignal.timeout(30_000),
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (ct && !ct.startsWith("image/")) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 2000) return null; // ảnh rỗng/lỗi/placeholder
    const dir = path.join(process.cwd(), "public", "assets", "images");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, filename), buffer);
    return `/assets/images/${filename}`;
  } catch {
    return null;
  }
}

export interface AcquireImageOptions {
  /** Link bài báo (nếu có) để ưu tiên og:image. */
  link?: string;
  /** Từ khoá tìm ảnh dự phòng. */
  query: string;
  /** Tên file lưu (vd imgpost_x_0.jpg). */
  filename: string;
  signal?: AbortSignal;
}

/**
 * Lấy 1 ảnh cho slide: ưu tiên og:image của bài báo → fallback tìm web theo từ khoá.
 * Trả đường dẫn public, hoặc null nếu cả hai nguồn đều thất bại (caller tự quyết bỏ/giữ slide).
 */
export async function acquireSlideImage(opts: AcquireImageOptions): Promise<string | null> {
  const { link, query, filename, signal } = opts;

  if (link) {
    const og = await fetchOgImage(link, signal);
    if (og) {
      const saved = await downloadImage(og, filename, signal);
      if (saved) return saved;
    }
  }

  if (query) {
    const found = await searchWebImage(query, signal);
    if (found) {
      const saved = await downloadImage(found, filename, signal);
      if (saved) return saved;
    }
  }

  return null;
}
