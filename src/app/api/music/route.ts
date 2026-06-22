import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Liệt kê các track nhạc nền có trong public/assets/music. */
export function GET() {
  try {
    const dir = path.join(process.cwd(), "public", "assets", "music");
    const tracks = fs
      .readdirSync(dir)
      .filter((n) => /\.(mp3|m4a|aac|wav|ogg)$/i.test(n))
      .map((n) => `/assets/music/${n}`);
    return Response.json({ tracks });
  } catch {
    return Response.json({ tracks: [] });
  }
}
