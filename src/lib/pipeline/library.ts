import fs from "fs";
import path from "path";

export interface LibraryJob {
  id: string;
  type: "video" | "imagepost";
  title: string;
  aspectRatio: string;
  createdAt: string; // ISO
  videoUrl?: string;
  images?: string[];
  thumb?: string; // ảnh đại diện
}

const DATA_DIR = path.join(process.cwd(), "public", "assets", "data");
const JOBS_FILE = path.join(DATA_DIR, "jobs.json");
const MAX = 100;

export function listJobs(): LibraryJob[] {
  try {
    return JSON.parse(fs.readFileSync(JOBS_FILE, "utf-8")) as LibraryJob[];
  } catch {
    return [];
  }
}

export function recordJob(job: LibraryJob): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const jobs = listJobs().filter((j) => j.id !== job.id);
  jobs.unshift(job);
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs.slice(0, MAX), null, 2), "utf-8");
}

/** Xoá job + file media của nó. Trả về true nếu tìm thấy. */
export function deleteJob(id: string): boolean {
  const jobs = listJobs();
  const job = jobs.find((j) => j.id === id);
  if (!job) return false;
  const pub = path.join(process.cwd(), "public");
  const files = [job.videoUrl, ...(job.images ?? [])].filter(Boolean) as string[];
  for (const f of files) {
    try {
      fs.rmSync(path.join(pub, f.replace(/^\//, "")), { force: true });
    } catch {
      /* bỏ qua */
    }
  }
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs.filter((j) => j.id !== id), null, 2), "utf-8");
  return true;
}
