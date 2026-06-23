import fs from "fs";
import path from "path";

export interface AutomationTemplate {
  id: string;
  name: string;
  type: "video" | "imagepost";
  aspectRatio: string;
  scriptStructure: any;
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), "public", "assets", "data");
const TEMPLATES_FILE = path.join(DATA_DIR, "automation_templates.json");
const MAX = 50;

export function listTemplates(): AutomationTemplate[] {
  try {
    return JSON.parse(fs.readFileSync(TEMPLATES_FILE, "utf-8")) as AutomationTemplate[];
  } catch {
    return [];
  }
}

export function saveTemplate(template: AutomationTemplate): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const templates = listTemplates().filter((t) => t.id !== template.id);
  templates.unshift(template);
  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates.slice(0, MAX), null, 2), "utf-8");
}

export function deleteTemplate(id: string): boolean {
  const templates = listTemplates();
  const idx = templates.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  templates.splice(idx, 1);
  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2), "utf-8");
  return true;
}
