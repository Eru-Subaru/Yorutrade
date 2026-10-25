import { isIP } from "node:net";

const MAX_BODY = 4 * 1024 * 1024;
type Settings = { workerUrl?: string; origin?: string; secret?: string; production: boolean; vercel: boolean };
const error = (message: string, status: number) => Response.json({ error: message }, { status, headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });

export async function proxyApi(request: Request, parts: string[], settings: Settings): Promise<Response> {
  const path = parts.join("/");
  if (!/^(session|listings|matches|images|health)(\/[a-zA-Z0-9-]+){0,2}$/.test(path)) return error("見つかりませんでした。", 404);
  const local = new URL(request.url);
  let origin: string;
  let upstream: URL;
  try {
    if (settings.production && (!settings.workerUrl || !settings.origin || !settings.secret || settings.secret.length < 32)) throw new Error();
    origin = new URL(settings.origin || "http://localhost:3000").origin;
    upstream = new URL(settings.workerUrl || "http://127.0.0.1:8787");
    const localWorker = !settings.production && ["127.0.0.1", "localhost"].includes(upstream.hostname);
    if ((!localWorker && upstream.protocol !== "https:") || upstream.username || upstream.password || upstream.pathname !== "/" || upstream.search || upstream.hash) throw new Error();
    if (settings.production && !origin.startsWith("https://")) throw new Error();
  } catch { return error("サービスの接続設定が必要です。しばらくしてからお試しください。", 503); }
  const incomingOrigin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site" || (incomingOrigin && incomingOrigin !== origin)) return error("この操作は許可されていません。", 403);
  if (!["GET", "HEAD"].includes(request.method) && incomingOrigin !== origin) return error("この操作は許可されていません。", 403);

  const headers = new Headers({ Origin: origin });
  for (const key of ["content-type", "accept"]) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }
  // Never send unrelated site cookies, incoming secrets or arbitrary proxy headers upstream.
  const sessionCookie = request.headers.get("cookie")?.split(";").map(x => x.trim()).find(x => /^yt_session=[A-Za-z0-9_-]+$/.test(x));
  if (sessionCookie) headers.set("Cookie", sessionCookie);
  if (settings.secret) headers.set("X-Yorutrade-Proxy-Secret", settings.secret);
  const platformIP = settings.vercel ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() : undefined;
  if (platformIP && isIP(platformIP)) headers.set("X-Yorutrade-Client-IP", platformIP);

  let body: Uint8Array | undefined;
  if (!["GET", "HEAD"].includes(request.method)) {
    const contentLength = request.headers.get("content-length");
    if (contentLength && (!/^\d+$/.test(contentLength) || Number(contentLength) > MAX_BODY)) return error("送信するデータが大きすぎます。", 413);
    const reader = request.body?.getReader();
    if (reader) {
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > MAX_BODY) { await reader.cancel(); return error("送信するデータが大きすぎます。", 413); }
          chunks.push(value);
        }
      } catch { return error("送信内容を読み込めませんでした。", 400); }
      body = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
    }
  }
  upstream.pathname = `/api/${parts.map(encodeURIComponent).join("/")}`;
  upstream.search = local.search;
  try {
    const response = await fetch(upstream, { method: request.method, headers, body: body as BodyInit | undefined, redirect: "error", cache: "no-store", signal: AbortSignal.timeout(20_000) });
    const responseHeaders = new Headers({ "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Vary": "Cookie" });
    for (const key of ["content-type", "set-cookie", "retry-after", "content-disposition"]) {
      const value = response.headers.get(key);
      if (value) responseHeaders.set(key, value);
    }
    return new Response(response.body, { status: response.status, headers: responseHeaders });
  } catch { return error("接続できませんでした。時間をおいて再度お試しください。", 502); }
}
