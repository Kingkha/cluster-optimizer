import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const ALLOWED_KEYS = [
  "dataforseo_login",
  "dataforseo_password",
];

export async function GET() {
  const settings = await prisma.appSettings.findMany();
  const result: Record<string, string> = {};
  for (const s of settings) {
    // Mask sensitive values
    if (s.key.includes("password") || s.key.includes("secret") || s.key.includes("token")) {
      result[s.key] = s.value ? "••••••••" : "";
    } else {
      result[s.key] = s.value;
    }
  }
  return NextResponse.json(result);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  for (const [key, value] of Object.entries(body)) {
    if (!ALLOWED_KEYS.includes(key)) continue;
    if (typeof value !== "string") continue;

    // Skip masked values (user didn't change them)
    if (value === "••••••••") continue;

    await prisma.appSettings.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  return NextResponse.json({ ok: true });
}
