import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendEmailPreview } from "@/lib/send-email";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const to = body.to || (session.user as { email?: string }).email;

  if (!to) return NextResponse.json({ error: "Email requis" }, { status: 400 });

  const result = await sendEmailPreview(to);
  return NextResponse.json(result);
}
