import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter for Edge middleware
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= limit;
}

// Cleanup old entries periodically
if (typeof globalThis !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of loginAttempts.entries()) {
      if (now > entry.resetAt) loginAttempts.delete(key);
    }
  }, 60_000);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limit login attempts: 10 per minute per IP
  if (
    pathname === "/api/auth/callback/credentials" ||
    pathname === "/api/auth/callback/magic"
  ) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const allowed = checkRateLimit(`login:${ip}`, 10, 60_000);

    if (!allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives de connexion. Veuillez patienter." },
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/callback/:path*"],
};
