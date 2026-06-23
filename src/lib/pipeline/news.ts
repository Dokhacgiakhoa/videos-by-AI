export interface NewsItem {
  title: string;
  source: string;
  date: string; // ISO
  link: string; // URL bài báo
  content?: string; // Nội dung chi tiết bài báo (cho nạp link thủ công)
  snippet?: string; // Tóm tắt ngắn
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
 * Lấy tin tức từ Google News RSS.
 *
 * @param query Từ khoá tìm tin
 * @param timeframe Khoảng thời gian quét ("24h" | "7d" | "30d" | "this_year" | "last_year" hoặc số ngày)
 * @param limit Số tin tối đa
 */
export async function fetchGoogleNews(
  query: string,
  timeframe: string | number = "7d",
  limit = 12,
): Promise<NewsItem[]> {
  let timeQuery = "";
  const parsedDays = parseInt(String(timeframe), 10);
  if (typeof timeframe === "number") {
    timeQuery = `when:${timeframe}d`;
  } else if (!isNaN(parsedDays) && /^\d+d$/.test(timeframe.trim())) {
    timeQuery = `when:${parsedDays}d`;
  } else {
    const currentYear = new Date().getFullYear();
    if (timeframe === "24h") timeQuery = "when:24h";
    else if (timeframe === "7d") timeQuery = "when:7d";
    else if (timeframe === "30d") timeQuery = "when:30d";
    else if (timeframe === "this_year") timeQuery = `after:${currentYear}-01-01`;
    else if (timeframe === "last_year") timeQuery = `after:${currentYear - 1}-01-01 before:${currentYear - 1}-12-31`;
    else timeQuery = `when:7d`;
  }

  const q = encodeURIComponent(`${query} ${timeQuery}`);
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
    const idx = rawTitle.lastIndexOf(" - ");
    const title = idx > 0 ? rawTitle.slice(0, idx) : rawTitle;
    const sourceFromTitle = idx > 0 ? rawTitle.slice(idx + 3) : "";
    const source = pick(block, "source") || sourceFromTitle || "Google News";
    const pubDate = pick(block, "pubDate");
    const date = pubDate ? new Date(pubDate).toISOString() : "";
    const link = pick(block, "link");

    const rawDesc = pick(block, "description") || "";
    const snippetRaw = stripTags(rawDesc).replace(/\s+/g, " ").trim();
    const snippet = snippetRaw.length > 20 ? snippetRaw : undefined;

    items.push({ title, source, date, link, snippet });
    if (items.length >= limit) break;
  }
  return items;
}

/** Tải nội dung HTML và bóc tách chữ từ 1 link thủ công */
export async function fetchManualUrl(url: string, signal?: AbortSignal): Promise<NewsItem | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml",
      },
      redirect: "follow",
      signal: signal ?? AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? stripTags(titleMatch[1]) : "";

    let source = "Web Source";
    try {
      source = new URL(url).hostname.replace("www.", "");
    } catch {}

    // Lấy các thẻ <p> chứa nội dung bài báo
    const pMatches = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
    const paragraphs = pMatches
      .map((p) => stripTags(p))
      .filter((p) => p.length > 20)
      .slice(0, 15); // Lấy tối đa 15 đoạn để tránh tràn ngữ cảnh

    const contentText = paragraphs.join("\n\n");

    return {
      title: title || url,
      source,
      date: new Date().toISOString(),
      link: url,
      content: contentText || undefined,
    };
  } catch {
    return null;
  }
}

/** Tải đồng thời danh sách các link nguồn */
export async function fetchManualUrls(urls: string[], signal?: AbortSignal): Promise<NewsItem[]> {
  const list = urls.filter((u) => u.trim().startsWith("http"));
  const tasks = list.map((u) => fetchManualUrl(u.trim(), signal));
  const results = await Promise.all(tasks);
  return results.filter((r): r is NewsItem => r !== null);
}

/** Định dạng danh sách tin thành khối text để nhồi vào prompt LLM. */
export function formatNewsContext(items: NewsItem[]): string {
  return items
    .map((it, i) => {
      const d = it.date ? it.date.slice(0, 10) : "?";
      let res = `${i + 1}. [${d}] ${it.title} (${it.source})`;
      if (it.content) {
        res += `\n   Nội dung chi tiết:\n   """\n   ${it.content}\n   """`;
      }
      return res;
    })
    .join("\n\n");
}
