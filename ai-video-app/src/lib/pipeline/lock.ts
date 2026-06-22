/**
 * Khoá job in-memory: chỉ cho phép 1 job chạy tại một thời điểm.
 * Chống quá tải GPU/CPU (memory: RTX 2080 Ti dễ BSOD khi chạy song song).
 * Giới hạn: chỉ hiệu lực trong 1 process (đủ cho app local 1 người dùng).
 */
let busy = false;
let currentJob = "";

export function tryAcquire(jobLabel: string): boolean {
  if (busy) return false;
  busy = true;
  currentJob = jobLabel;
  return true;
}

export function release(): void {
  busy = false;
  currentJob = "";
}

export function currentJobLabel(): string {
  return currentJob;
}
