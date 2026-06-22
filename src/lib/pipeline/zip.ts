import { spawn } from "child_process";
import fs from "fs";
import path from "path";

/**
 * Nén danh sách file thành 1 .zip bằng PowerShell Compress-Archive (Windows, không cần lib ngoài).
 * @param absFiles danh sách đường dẫn tuyệt đối
 * @param outAbs đường dẫn .zip output (tuyệt đối)
 */
export async function zipFiles(absFiles: string[], outAbs: string): Promise<void> {
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });
  if (fs.existsSync(outAbs)) fs.rmSync(outAbs);
  const list = absFiles.map((f) => `'${f.replace(/'/g, "''")}'`).join(",");
  const cmd = `Compress-Archive -Path ${list} -DestinationPath '${outAbs.replace(/'/g, "''")}' -Force`;
  await new Promise<void>((resolve, reject) => {
    const proc = spawn("powershell", ["-NoProfile", "-NonInteractive", "-Command", cmd]);
    let stderr = "";
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", (err) => reject(new Error(`Không zip được (PowerShell): ${err.message}`)));
    proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`Compress-Archive lỗi ${code}: ${stderr.slice(-500)}`))));
  });
}
