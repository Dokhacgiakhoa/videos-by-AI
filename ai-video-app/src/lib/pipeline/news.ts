export interface NewsItem {
  title: string;
  source: string;
  date: string; // ISO
}

function stripTags(s: string): string {
  return s
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function pick(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? stripTags(m[1]) : "";
}

/**
 * Lấy tin tức THẬT từ Google News RSS (miễn phí, không cần API key).
 * Lọc theo tiếng Việt + khu vực VN + độ mới.
 *
 * @param query Từ khoá tìm tin (vd "trí tuệ nhân tạo")
 * @param withinDays Số ngày gần đây (mặc định 7)
 * @param limit Số tin tối đa trả về
 */
export async function fetchGoogleNews(query: string, withinDays = 7, limit = 12): Promise<NewsItem[]> {
  const q = encodeURIComponent(`${query} when:${withinDays}d`);
  const url = `https://news.google.com/rss/search?q=${q}&hl=vi&gl=VN&ceid=VN:vi`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ai-video-app/1.0)" },
  });
  if (!res.ok) {
    throw new Error(`Google News RSS lỗi ${res.status}`);
  }
  const xml = await res.text();

  const items: NewsItem[] = [];
  const blocks = xml.split(/<item>/i).slice(1);
  for (const block of blocks) {
    const rawTitle = pick(block, "title");
    if (!rawTitle) continue;
    // Title của Google News thường là "Tiêu đề - Nguồn"
    const idx = rawTitle.lastIndexOf(" - ");
    const title = idx > 0 ? rawTitle.slice(0, idx) : rawTitle;
    const sourceFromTitle = idx > 0 ? rawTitle.slice(idx + 3) : "";
    const source = pick(block, "source") || sourceFromTitle || "Google News";
    const pubDate = pick(block, "pubDate");
    const date = pubDate ? new Date(pubDate).toISOString() : "";
    items.push({ title, source, date });
    if (items.length >= limit) break;
  }
  return items;
}

/** Định dạng danh sách tin thành khối text để nhồi vào prompt LLM. */
export function formatNewsContext(items: NewsItem[]): string {
  return items
    .map((it, i) => {
      const d = it.date ? it.date.slice(0, 10) : "?";
      return `${i + 1}. [${d}] ${it.title} (${it.source})`;
    })
    .join("\n");
}
