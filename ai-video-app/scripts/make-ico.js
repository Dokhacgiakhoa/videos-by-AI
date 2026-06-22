/**
 * Tạo public/ai91-logo.ico (256x256, PNG-compressed) từ logo.
 * Chạy: node scripts/make-ico.js
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "public", "ai91-logo-hi.png");
const OUT = path.join(ROOT, "public", "ai91-logo.ico");

async function main() {
  // PNG 256x256, logo canh giữa trên nền trong suốt
  const png = await sharp(SRC)
    .resize({ width: 256, height: 256, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // ICONDIR (6) + ICONDIRENTRY (16) + PNG
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type = icon
  header.writeUInt16LE(1, 4); // count = 1

  const entry = Buffer.alloc(16);
  entry.writeUInt8(0, 0); // width 0 => 256
  entry.writeUInt8(0, 1); // height 0 => 256
  entry.writeUInt8(0, 2); // colors
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // planes
  entry.writeUInt16LE(32, 6); // bpp
  entry.writeUInt32LE(png.length, 8); // bytes in resource
  entry.writeUInt32LE(6 + 16, 12); // offset

  fs.writeFileSync(OUT, Buffer.concat([header, entry, png]));
  console.log("Đã tạo", OUT, `(${(fs.statSync(OUT).size / 1024).toFixed(1)} KB)`);
}

main().catch((e) => {
  console.error("LỖI:", e.message);
  process.exit(1);
});
