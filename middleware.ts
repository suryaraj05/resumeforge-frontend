import { NextRequest, NextResponse } from "next/server";

const LOCAL = "http://127.0.0.1:4000";

function backendOrigin(): string {
  const u =
    process.env.API_URL?.trim() ||
    process.env.BACKEND_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim();
  if (u) return u.replace(/\/$/, "");
  return LOCAL;
}

const SKIP_HEADER = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

function buildProxyHeaders(req: NextRequest): Headers {
  const h = new Headers();
  req.headers.forEach((value, key) => {
    if (SKIP_HEADER.has(key.toLowerCase())) return;
    h.set(key, value);
  });
  return h;
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const path = req.nextUrl.pathname;
  const origin = backendOrigin();
  if (process.env.VERCEL && origin === LOCAL) {
    return NextResponse.json(
      {
        error:
          "Missing API_URL on Vercel. Add API_URL=https://your-app.up.railway.app (no trailing slash), redeploy, and keep NEXT_PUBLIC_API_URL unset for same-origin /api.",
      },
      { status: 503 }
    );
  }

  const target = new URL(path + req.nextUrl.search, origin);

  const init: RequestInit = {
    method: req.method,
    headers: buildProxyHeaders(req),
    cache: "no-store",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    const buf = await req.arrayBuffer();
    if (buf.byteLength > 0) {
      init.body = buf;
    }
  }

  try {
    const upstream = await fetch(target, init);
    const outHeaders = new Headers(upstream.headers);
    return new NextResponse(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: outHeaders,
    });
  } catch {
    return NextResponse.json(
      { error: "Backend unreachable from edge. Check API_URL and Railway." },
      { status: 502 }
    );
  }
}

export const config = {
  matcher: ["/api/:path*"],
};
