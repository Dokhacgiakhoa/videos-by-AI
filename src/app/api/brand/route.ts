import fs from "fs";
import path from "path";
import { Vibrant } from "node-vibrant/node";

const BRAND_DIR = path.join(process.cwd(), "public", "assets", "brand");
const BRAND_JSON = path.join(BRAND_DIR, "brand.json");

export interface BrandPalette {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  text: string;
}

export interface BrandData {
  logoUrl: string;
  palette: BrandPalette;
  extractedColors?: string[];
}

function hexFromRgb(rgb: number[] | undefined): string | null {
  if (!rgb || rgb.length < 3) return null;
  return "#" + rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("");
}

export const runtime = "nodejs";

/** POST: upload logo → extract palette → save brand.json */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("logo") as File | null;
    if (!file || !file.type.startsWith("image/")) {
      return Response.json({ error: "Cần upload file ảnh (image/*)" }, { status: 400 });
    }

    fs.mkdirSync(BRAND_DIR, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const filename = `logo.${ext}`;
    const filePath = path.join(BRAND_DIR, filename);
    fs.writeFileSync(filePath, buffer);
    const logoUrl = `/assets/brand/${filename}`;

    const palette = await Vibrant.from(filePath).getPalette();

    const swatches = [
      palette.Vibrant,
      palette.LightVibrant,
      palette.DarkVibrant,
      palette.Muted,
      palette.LightMuted,
      palette.DarkMuted,
    ];
    
    // Extract non-null colors and deduplicate
    const extractedColors = Array.from(new Set(
      swatches
        .map(s => hexFromRgb(s?.rgb))
        .filter((hex): hex is string => hex !== null)
    )).slice(0, 6);

    // If not enough colors, fallback with some defaults to ensure we have 6 options if possible
    const fallbacks = ["#ff5a1f", "#2fe6d6", "#ff8a3d", "#06080c", "#eef2f6", "#f59e0b"];
    while (extractedColors.length < 6) {
      extractedColors.push(fallbacks[extractedColors.length]);
    }

    const brand: BrandData = {
      logoUrl,
      palette: {
        primary: hexFromRgb(palette.Vibrant?.rgb) ?? "#ff5a1f",
        secondary: hexFromRgb(palette.LightVibrant?.rgb) ?? "#2fe6d6",
        accent: hexFromRgb(palette.DarkVibrant?.rgb) ?? "#ff8a3d",
        bg: hexFromRgb(palette.DarkMuted?.rgb) ?? "#06080c",
        text: hexFromRgb(palette.LightMuted?.rgb) ?? "#eef2f6",
      },
      extractedColors,
    };

    fs.writeFileSync(BRAND_JSON, JSON.stringify(brand, null, 2), "utf-8");

    return Response.json(brand);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

/** GET: đọc brand.json đã lưu (nếu có) */
export async function GET() {
  try {
    if (!fs.existsSync(BRAND_JSON)) {
      return Response.json({ brand: null });
    }
    const brand = JSON.parse(fs.readFileSync(BRAND_JSON, "utf-8")) as BrandData;
    return Response.json(brand);
  } catch {
    return Response.json({ brand: null });
  }
}

/** DELETE: xóa brand → quay về palette mặc định */
export async function DELETE() {
  try {
    if (fs.existsSync(BRAND_JSON)) fs.rmSync(BRAND_JSON, { force: true });
    const logoPath = path.join(BRAND_DIR, "logo.*");
    for (const f of fs.readdirSync(BRAND_DIR).filter((n) => n.startsWith("logo."))) {
      fs.rmSync(path.join(BRAND_DIR, f), { force: true });
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: true });
  }
}
