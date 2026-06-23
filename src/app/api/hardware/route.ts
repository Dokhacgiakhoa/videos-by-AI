import os from "os";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET() {
  const cpus = os.cpus();
  const totalMem = os.totalmem() / (1024 ** 3); // GB
  const freeMem = os.freemem() / (1024 ** 3); // GB

  let cpuDetail = cpus[0].model;
  let cores = cpus.length;
  let threads = cpus.length;
  let ramDetail = `${totalMem.toFixed(1)}GB`;
  let gpuModel = "Không xác định";
  let hasDedicatedGpu = false;

  try {
    // 1. Get CPU Cores/Threads via PowerShell
    const { stdout: cpuOut } = await execAsync('powershell "Get-CimInstance Win32_Processor | Select-Object Name, NumberOfCores, NumberOfLogicalProcessors | ConvertTo-Json"');
    try {
      const cpuData = JSON.parse(cpuOut);
      if (Array.isArray(cpuData)) {
        cpuDetail = cpuData.map(c => c.Name).join(", ");
        cores = cpuData.reduce((acc, c) => acc + (c.NumberOfCores || 0), 0);
        threads = cpuData.reduce((acc, c) => acc + (c.NumberOfLogicalProcessors || 0), 0);
      } else if (cpuData) {
        cpuDetail = cpuData.Name || cpuDetail;
        cores = cpuData.NumberOfCores || cores;
        threads = cpuData.NumberOfLogicalProcessors || threads;
      }
    } catch {}

    // 2. Get RAM Layout via PowerShell
    const { stdout: ramOut } = await execAsync('powershell "Get-CimInstance Win32_PhysicalMemory | Select-Object Capacity, SMBIOSMemoryType, Speed | ConvertTo-Json"');
    try {
      const ramData = JSON.parse(ramOut);
      const arr = Array.isArray(ramData) ? ramData : [ramData];
      if (arr.length > 0) {
        const totalGB = arr.reduce((acc, r) => acc + (r.Capacity || 0), 0) / (1024 ** 3);
        const stickGB = arr[0].Capacity / (1024 ** 3);
        const speed = arr[0].Speed || "?";
        let ddr = "DDR";
        const smbios = arr[0].SMBIOSMemoryType;
        if (smbios === 24) ddr = "DDR3";
        else if (smbios === 26) ddr = "DDR4";
        else if (smbios === 34) ddr = "DDR5";
        
        ramDetail = `${totalGB}GB (${stickGB}GB x ${arr.length} thanh), ${ddr} ${speed}MHz`;
      }
    } catch {}

    // 3. Get GPU via nvidia-smi (most accurate for VRAM) or fallback to PowerShell
    try {
      const { stdout: nvidiaOut } = await execAsync("nvidia-smi --query-gpu=name,memory.total --format=csv,noheader");
      if (nvidiaOut.trim()) {
        gpuModel = nvidiaOut.split("\n").map(l => l.trim()).filter(Boolean).join(" | ");
        hasDedicatedGpu = true;
      }
    } catch {
      // Fallback if not nvidia
      const { stdout: wmiGpu } = await execAsync('powershell "Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name"');
      const lines = wmiGpu.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        gpuModel = lines.join(", ");
        const lowerGpu = gpuModel.toLowerCase();
        if (lowerGpu.includes("nvidia") || lowerGpu.includes("amd") || lowerGpu.includes("radeon") || lowerGpu.includes("rtx") || lowerGpu.includes("gtx")) {
           hasDedicatedGpu = true;
        }
      }
    }
  } catch (err) {
    // Ignore error
  }

  // Ollama thường cần tối thiểu 8GB RAM hoặc Card rời để chạy mượt
  const isSafe = totalMem >= 7.5 || hasDedicatedGpu;

  return Response.json({
    cpuDetail,
    cores,
    threads,
    gpuModel,
    ramDetail,
    isSafe,
    message: isSafe
      ? (hasDedicatedGpu ? "Có Card rời: Đạt chuẩn để gánh Local AI." : "Đủ RAM: Có thể chạy Local AI (nhưng CPU sẽ gánh nhiều).")
      : "Cảnh báo: Không có Card rời & RAM thấp. Nguy cơ treo máy cao, hãy bật Có API.",
  });
}
