import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const LOCAL_FALLBACK = "http://127.0.0.1:4000";

function backendBase(): string {
  const u =
    process.env.API_URL?.trim() ||
    process.env.BACKEND_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim();
  if (u) return u.replace(/\/$/, "");
  return LOCAL_FALLBACK;
}

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
]);

function forwardHeaders(req: NextRequest): Headers {
  const out = new Headers();
  req.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (HOP_BY_HOP.has(k)) return;
    out.set(key, value);
  });
  return out;
}

async function proxy(req: NextRequest, pathSegments: string[]): Promise<NextResponse> {
  const base = backendBase();
  if (process.env.VERCEL && base === LOCAL_FALLBACK) {
    return NextResponse.json(
      {
        error:
          "Set API_URL (or BACKEND_URL) on Vercel to your Railway backend origin, e.g. https://your-service.up.railway.app — then redeploy. Leave NEXT_PUBLIC_API_URL empty so the browser uses this proxy.",
      },
      { status: 503 }
    );
  }

  const subpath = pathSegments.join("/");
  const target = new URL(`${base}/api/${subpath}${req.nextUrl.search}`);

  const init: RequestInit = {
    method: req.method,
    headers: forwardHeaders(req),
    cache: "no-store",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    const buf = await req.arrayBuffer();
    if (buf.byteLength > 0) {
      init.body = buf;
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch {
    return NextResponse.json(
      { error: "Could not reach backend API. Check API_URL and that the backend is running." },
      { status: 502 }
    );
  }

  const resHeaders = new Headers(upstream.headers);
  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: resHeaders,
  });
}

export async function GET(
  req: NextRequest,
  ctx: { params: { path: string[] } }
) {
  return proxy(req, ctx.params.path);
}

export async function POST(
  req: NextRequest,
  ctx: { params: { path: string[] } }
) {
  return proxy(req, ctx.params.path);
}

export async function PUT(
  req: NextRequest,
  ctx: { params: { path: string[] } }
) {
  return proxy(req, ctx.params.path);
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: { path: string[] } }
) {
  return proxy(req, ctx.params.path);
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: { path: string[] } }
) {
  return proxy(req, ctx.params.path);
}

export async function OPTIONS(
  req: NextRequest,
  ctx: { params: { path: string[] } }
) {
  return proxy(req, ctx.params.path);
}
