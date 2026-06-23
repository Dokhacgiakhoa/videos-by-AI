import { listTemplates, saveTemplate, deleteTemplate, AutomationTemplate } from "@/lib/pipeline/automation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ templates: listTemplates() });
}

export async function POST(request: Request) {
  try {
    const template: AutomationTemplate = await request.json();
    if (!template.id || !template.name) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    saveTemplate(template);
    return Response.json({ ok: true, template });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });
  const ok = deleteTemplate(id);
  return Response.json({ ok });
}
