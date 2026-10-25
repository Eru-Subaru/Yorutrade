export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
  ALLOWED_ORIGINS: string;
  API_PROXY_SECRET?: string;
  LOCAL_DEV?: string;
}

type User = { id: string; displayName: string };
type Session = { user: User; tokenHash: string };
type MatchRow = {
  id: string; status: string; initiatorId: string; recipientId: string;
  listingId: string; offeredListingId: string; listingTitle: string;
  offeredTitle: string; partnerName: string; createdAt: number;
};

const IMAGE_LIMIT = 5 * 1024 * 1024;
const SESSION_SECONDS = 180 * 24 * 60 * 60;
const LISTING_AGE = 30 * 24 * 60 * 60 * 1000;
const ID = /^[a-f0-9-]{36}$/i;
const MUTATIONS = new Set(["POST", "PATCH", "DELETE", "PUT"]);

class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

function json(data: unknown, status = 200, headers?: HeadersInit): Response {
  const h = new Headers(headers);
  h.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { status, headers: h });
}

function normalize(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

function textField(body: Record<string, unknown>, key: string, max: number, optional = false): string {
  const value = body[key];
  if (optional && (value === undefined || value === null)) return "";
  if (typeof value !== "string" || value.trim().length > max || (!optional && !value.trim())) {
    throw new ApiError(400, `${key} を${max}文字以内で入力してください。`);
  }
  return value.trim();
}

async function readBody(request: Request, max: number): Promise<Uint8Array> {
  const length = request.headers.get("Content-Length");
  if (length && Number(length) > max) throw new ApiError(413, "送信データが大きすぎます。");
  if (!request.body) throw new ApiError(400, "送信内容を確認してください。");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      size += result.value.byteLength;
      if (size > max) { await reader.cancel(); throw new ApiError(413, "送信データが大きすぎます。"); }
      chunks.push(result.value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return bytes;
}

async function bodyJson(request: Request): Promise<Record<string, unknown>> {
  if (request.headers.get("Content-Type")?.split(";")[0]?.trim() !== "application/json") {
    throw new ApiError(415, "JSON形式で送信してください。");
  }
  const bytes = await readBody(request, 16 * 1024);
  let value: unknown;
  try { value = JSON.parse(new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(bytes)); }
  catch { throw new ApiError(400, "送信内容を確認してください。"); }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ApiError(400, "送信内容を確認してください。");
  return value as Record<string, unknown>;
}

async function hash(value: string): Promise<string> {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function secretEquals(a: string, b: string): Promise<boolean> {
  const [ah, bh] = await Promise.all([hash(a), hash(b)]);
  let difference = 0;
  for (let i = 0; i < ah.length; i++) difference |= ah.charCodeAt(i) ^ bh.charCodeAt(i);
  return difference === 0;
}

function origins(env: Env): string[] {
  const configured = env.ALLOWED_ORIGINS.split(",").map((value) => value.trim()).filter(Boolean);
  if (env.LOCAL_DEV === "true") configured.push("http://localhost:3000", "http://127.0.0.1:3000");
  return configured;
}

async function guard(request: Request, env: Env): Promise<void> {
  if (env.LOCAL_DEV !== "true") {
    if (!env.API_PROXY_SECRET || env.API_PROXY_SECRET.length < 32) throw new ApiError(503, "サービスの設定を確認しています。しばらくお待ちください。");
    const provided = request.headers.get("X-Yorutrade-Proxy-Secret") ?? "";
    if (!await secretEquals(provided, env.API_PROXY_SECRET)) throw new ApiError(403, "アクセスできません。");
  }
  const origin = request.headers.get("Origin");
  if (origin && !origins(env).includes(origin)) throw new ApiError(403, "この接続元は許可されていません。");
  if (MUTATIONS.has(request.method) && !origin) throw new ApiError(403, "接続元を確認できません。");
}

async function rateLimit(env: Env, scope: string, identity: string, maximum: number, seconds: number): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const window = Math.floor(now / seconds);
  const key = `${scope}:${await hash(identity)}:${window}`;
  const row = await env.DB.prepare(`INSERT INTO rate_limits(key, count, expires_at) VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET count = count + 1 RETURNING count`).bind(key, (window + 1) * seconds).first<{ count: number }>();
  if (!row || row.count > maximum) throw new ApiError(429, "送信が多すぎます。少し待ってからお試しください。");
}

function clientIp(request: Request, env: Env): string {
  // The Next proxy overwrites this header and is authenticated by API_PROXY_SECRET.
  return (env.LOCAL_DEV !== "true" ? request.headers.get("X-Yorutrade-Client-IP") : null)
    || request.headers.get("CF-Connecting-IP") || "local";
}

async function getSession(request: Request, env: Env): Promise<Session | null> {
  const token = request.headers.get("Cookie")?.match(/(?:^|;\s*)yt_session=([a-f0-9]{64})(?:;|$)/)?.[1];
  if (!token) return null;
  const tokenHash = await hash(token);
  const user = await env.DB.prepare(`SELECT u.id, u.display_name AS displayName FROM sessions s
    JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?`)
    .bind(tokenHash, Math.floor(Date.now() / 1000)).first<User>();
  return user ? { user, tokenHash } : null;
}

async function requireSession(request: Request, env: Env): Promise<Session> {
  const session = await getSession(request, env);
  if (!session) throw new ApiError(401, "ページを再読み込みして、利用を開始してください。");
  return session;
}

async function createSession(request: Request, env: Env): Promise<Response> {
  const current = await getSession(request, env);
  if (current) return json({ user: current.user });
  await rateLimit(env, "sessions", clientIp(request, env), 20, 3600);
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  const user = { id: crypto.randomUUID(), displayName: "個体さん" };
  await env.DB.batch([
    env.DB.prepare("INSERT INTO users(id, display_name, created_at) VALUES (?, ?, ?)").bind(user.id, user.displayName, Date.now()),
    env.DB.prepare("INSERT INTO sessions(token_hash, user_id, expires_at) VALUES (?, ?, ?)").bind(await hash(token), user.id, Math.floor(Date.now() / 1000) + SESSION_SECONDS),
  ]);
  const secure = env.LOCAL_DEV === "true" ? "" : "; Secure";
  return json({ user }, 200, { "Set-Cookie": `yt_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_SECONDS}${secure}` });
}

const listingSelect = `SELECT l.id, l.owner_id AS ownerId, u.display_name AS displayName, l.title,
  l.have, l.want, l.category, l.event, l.notes, l.image_id AS imageId, l.created_at AS createdAt
  FROM listings l JOIN users u ON u.id = l.owner_id`;

async function listListings(request: Request, env: Env, url: URL): Promise<Response> {
  const query = (url.searchParams.get("q") ?? "").trim().slice(0, 120);
  const category = url.searchParams.get("category");
  const mine = url.searchParams.get("mine") === "1";
  let sql = `${listingSelect} WHERE l.status = 'active' AND l.created_at > ?`;
  const values: (string | number)[] = [Date.now() - LISTING_AGE];
  if (mine) {
    const session = await requireSession(request, env);
    sql += " AND l.owner_id = ?"; values.push(session.user.id);
  }
  if (category && category !== "all") {
    if (category !== "goods" && category !== "pick") throw new ApiError(400, "カテゴリを確認してください。");
    sql += " AND l.category = ?"; values.push(category);
  }
  if (query) {
    sql += " AND (l.title LIKE ? OR l.have LIKE ? OR l.want LIKE ? OR l.event LIKE ?)";
    values.push(...Array<string>(4).fill(`%${query}%`));
  }
  const result = await env.DB.prepare(`${sql} ORDER BY l.created_at DESC, l.id LIMIT 100`).bind(...values).all();
  return json({ listings: result.results });
}

async function createListing(request: Request, env: Env): Promise<Response> {
  const session = await requireSession(request, env);
  await rateLimit(env, "listing-user", session.user.id, 10, 3600);
  await rateLimit(env, "listing-ip", clientIp(request, env), 50, 3600);
  const body = await bodyJson(request);
  const title = textField(body, "title", 120);
  const have = textField(body, "have", 120);
  const want = textField(body, "want", 120);
  const event = textField(body, "event", 120);
  const notes = textField(body, "notes", 1000, true);
  if (body.category !== "goods" && body.category !== "pick") throw new ApiError(400, "カテゴリを選んでください。");
  const imageId = body.imageId === undefined || body.imageId === null || body.imageId === "" ? null : textField(body, "imageId", 36);
  if (imageId && !ID.test(imageId)) throw new ApiError(400, "写真を確認してください。");
  if (imageId) {
    const image = await env.DB.prepare(`SELECT i.id FROM images i LEFT JOIN listings l ON l.image_id = i.id
      WHERE i.id = ? AND i.owner_id = ? AND l.id IS NULL`).bind(imageId, session.user.id).first();
    if (!image) throw new ApiError(403, "この写真は利用できません。");
  }
  const id = crypto.randomUUID();
  try {
    await env.DB.prepare(`INSERT INTO listings(id, owner_id, title, have, want, category, event, notes,
      have_normalized, want_normalized, event_normalized, image_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, session.user.id, title, have, want, body.category,
      event, notes, normalize(have), normalize(want), normalize(event), imageId, Date.now()).run();
  } catch (error) {
    if (String(error).includes("UNIQUE constraint")) throw new ApiError(409, "この写真はすでに利用されています。");
    throw error;
  }
  const listing = await env.DB.prepare(`${listingSelect} WHERE l.id = ?`).bind(id).first();
  return json({ listing }, 201);
}

const matchSelect = `SELECT m.id, m.status, m.initiator_id AS initiatorId, m.recipient_id AS recipientId,
  m.listing_id AS listingId, m.offered_listing_id AS offeredListingId, l.title AS listingTitle,
  o.title AS offeredTitle, u.display_name AS partnerName, m.created_at AS createdAt
  FROM matches m JOIN listings l ON l.id = m.listing_id JOIN listings o ON o.id = m.offered_listing_id
  JOIN users u ON u.id = CASE WHEN m.initiator_id = ? THEN m.recipient_id ELSE m.initiator_id END`;

async function findMatch(env: Env, id: string, userId: string): Promise<MatchRow> {
  const match = await env.DB.prepare(`${matchSelect} WHERE m.id = ? AND (m.initiator_id = ? OR m.recipient_id = ?)`)
    .bind(userId, id, userId, userId).first<MatchRow>();
  if (!match) throw new ApiError(404, "やり取りが見つかりません。");
  return match;
}

async function createMatch(request: Request, env: Env): Promise<Response> {
  const session = await requireSession(request, env);
  await rateLimit(env, "match-user", session.user.id, 30, 3600);
  const body = await bodyJson(request);
  const listingId = textField(body, "listingId", 36);
  const offeredListingId = textField(body, "offeredListingId", 36);
  if (!ID.test(listingId) || !ID.test(offeredListingId)) throw new ApiError(400, "交換する登録を確認してください。");
  const id = crypto.randomUUID();
  try {
    const result = await env.DB.prepare(`INSERT INTO matches(id, initiator_id, recipient_id, listing_id, offered_listing_id, created_at)
      SELECT ?, o.owner_id, l.owner_id, l.id, o.id, ? FROM listings l JOIN listings o ON o.id = ?
      WHERE l.id = ? AND l.owner_id <> ? AND o.owner_id = ? AND l.status = 'active' AND o.status = 'active'
      AND l.have_normalized = o.want_normalized AND l.want_normalized = o.have_normalized
      AND l.event_normalized = o.event_normalized AND l.category = o.category
      AND l.created_at > ? AND o.created_at > ?`).bind(id, Date.now(), offeredListingId, listingId,
      session.user.id, session.user.id, Date.now() - LISTING_AGE, Date.now() - LISTING_AGE).run();
    if (!result.meta.changes) throw new ApiError(409, "同じ会場で、譲るものと欲しいものが一致する他の方の登録を選んでください。");
  } catch (error) {
    if (String(error).includes("UNIQUE constraint")) throw new ApiError(409, "この組み合わせにはすでに申し込みがあります。");
    throw error;
  }
  return json({ match: await findMatch(env, id, session.user.id) }, 201);
}

async function updateMatch(request: Request, env: Env, id: string): Promise<Response> {
  const session = await requireSession(request, env);
  await rateLimit(env, "match-update", session.user.id, 60, 3600);
  const match = await findMatch(env, id, session.user.id);
  if (match.recipientId !== session.user.id) throw new ApiError(403, "申し込みを受けた方だけが回答できます。");
  const body = await bodyJson(request);
  if (body.status !== "accepted" && body.status !== "declined") throw new ApiError(400, "回答を選んでください。");
  try {
    const result = await env.DB.prepare("UPDATE matches SET status = ? WHERE id = ? AND recipient_id = ? AND status = 'pending'")
      .bind(body.status, id, session.user.id).run();
    if (!result.meta.changes) throw new ApiError(409, "この申し込みにはすでに回答済みです。");
  } catch (error) {
    if (String(error).includes("listings_unavailable")) throw new ApiError(409, "この品物はほかの交換が決まりました。");
    throw error;
  }
  return json({ match: await findMatch(env, id, session.user.id) });
}

async function messages(request: Request, env: Env, id: string): Promise<Response> {
  const session = await requireSession(request, env);
  const match = await findMatch(env, id, session.user.id);
  if (match.status !== "accepted") throw new ApiError(403, "双方の合意後にチャットを利用できます。");
  if (request.method === "GET") {
    // Return the latest 200 in chronological order; old histories are never exposed across matches.
    const result = await env.DB.prepare(`SELECT * FROM (SELECT id, sender_id AS senderId, text, created_at AS createdAt
      FROM messages WHERE match_id = ? ORDER BY created_at DESC, id DESC LIMIT 200) ORDER BY createdAt, id`).bind(id).all();
    return json({ messages: result.results });
  }
  await rateLimit(env, "message-user", session.user.id, 30, 60);
  const body = await bodyJson(request);
  const message = { id: crypto.randomUUID(), senderId: session.user.id, text: textField(body, "text", 2000), createdAt: Date.now() };
  await env.DB.prepare("INSERT INTO messages(id, match_id, sender_id, text, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(message.id, id, message.senderId, message.text, message.createdAt).run();
  return json({ message }, 201);
}

function detectImage(bytes: Uint8Array): string | null {
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => bytes[i] === byte)) return "image/png";
  if (bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
  if (bytes.length >= 12 && new TextDecoder().decode(bytes.subarray(0, 4)) === "RIFF"
    && new TextDecoder().decode(bytes.subarray(8, 12)) === "WEBP") return "image/webp";
  return null;
}

async function uploadImage(request: Request, env: Env): Promise<Response> {
  const session = await requireSession(request, env);
  await rateLimit(env, "image-user", session.user.id, 10, 3600);
  await rateLimit(env, "image-ip", clientIp(request, env), 40, 3600);
  const declared = request.headers.get("Content-Type")?.split(";")[0]?.trim();
  if (!["image/jpeg", "image/png", "image/webp"].includes(declared ?? "")) throw new ApiError(415, "JPEG・PNG・WebPの写真を選んでください。");
  const bytes = await readBody(request, IMAGE_LIMIT);
  const detected = detectImage(bytes);
  if (!detected || detected !== declared) throw new ApiError(415, "写真の形式を確認してください。");
  const imageId = crypto.randomUUID();
  const key = `uploads/${imageId}`;
  await env.DB.prepare("INSERT INTO images(id, owner_id, object_key, content_type, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(imageId, session.user.id, key, detected, Date.now()).run();
  try {
    await env.IMAGES.put(key, bytes, { httpMetadata: { contentType: detected } });
  } catch (error) {
    // Deletion queues the key for eventual R2 cleanup, including ambiguous partial writes.
    await env.DB.prepare("DELETE FROM images WHERE id = ?").bind(imageId).run();
    throw error;
  }
  return json({ imageId }, 201);
}

async function getImage(request: Request, env: Env, id: string): Promise<Response> {
  const row = await env.DB.prepare(`SELECT i.object_key AS objectKey, i.content_type AS contentType, i.owner_id AS ownerId,
    l.id AS listingId, l.status, l.created_at AS createdAt FROM images i LEFT JOIN listings l ON l.image_id = i.id WHERE i.id = ?`).bind(id)
    .first<{ objectKey: string; contentType: string; ownerId: string; listingId: string | null; status: string | null; createdAt: number | null }>();
  if (!row) throw new ApiError(404, "写真が見つかりません。");
  const publicPhoto = row.listingId && row.status === "active" && (row.createdAt ?? 0) > Date.now() - LISTING_AGE;
  if (!publicPhoto) {
    const session = await getSession(request, env);
    if (session?.user.id !== row.ownerId) {
      const participant = session && row.listingId && await env.DB.prepare(`SELECT id FROM matches WHERE status = 'accepted'
        AND (listing_id = ? OR offered_listing_id = ?) AND (initiator_id = ? OR recipient_id = ?)`)
        .bind(row.listingId, row.listingId, session.user.id, session.user.id).first();
      if (!participant) throw new ApiError(404, "写真が見つかりません。");
    }
  }
  const object = await env.IMAGES.get(row.objectKey);
  if (!object) throw new ApiError(404, "写真が見つかりません。");
  return new Response(object.body, { headers: {
    "Content-Type": row.contentType,
    "Content-Disposition": 'inline; filename="photo"',
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; sandbox",
  } });
}

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  await guard(request, env);
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  if (url.pathname === "/api/health" && request.method === "GET") return json({ status: "ok", service: "yorutrade-api" });
  if (url.pathname === "/api/session") {
    if (request.method === "GET") return createSession(request, env);
    if (request.method === "PATCH") {
      const session = await requireSession(request, env);
      await rateLimit(env, "profile", session.user.id, 20, 3600);
      const body = await bodyJson(request);
      const displayName = textField(body, "displayName", 40);
      await env.DB.prepare("UPDATE users SET display_name = ? WHERE id = ?").bind(displayName, session.user.id).run();
      return json({ user: { ...session.user, displayName } });
    }
  }
  if (url.pathname === "/api/listings") {
    if (request.method === "GET") return listListings(request, env, url);
    if (request.method === "POST") return createListing(request, env);
  }
  if (url.pathname === "/api/matches") {
    if (request.method === "POST") return createMatch(request, env);
    if (request.method === "GET") {
      const session = await requireSession(request, env);
      const result = await env.DB.prepare(`${matchSelect} WHERE m.initiator_id = ? OR m.recipient_id = ? ORDER BY m.created_at DESC LIMIT 100`)
        .bind(session.user.id, session.user.id, session.user.id).all();
      return json({ matches: result.results });
    }
  }
  const matchPath = url.pathname.match(/^\/api\/matches\/([a-f0-9-]{36})$/i);
  if (matchPath?.[1] && request.method === "PATCH") return updateMatch(request, env, matchPath[1]);
  const messagesPath = url.pathname.match(/^\/api\/matches\/([a-f0-9-]{36})\/messages$/i);
  if (messagesPath?.[1] && (request.method === "GET" || request.method === "POST")) return messages(request, env, messagesPath[1]);
  if (url.pathname === "/api/images" && request.method === "POST") return uploadImage(request, env);
  const imagePath = url.pathname.match(/^\/api\/images\/([a-f0-9-]{36})$/i);
  if (imagePath?.[1] && request.method === "GET") return getImage(request, env, imagePath[1]);
  throw new ApiError(404, "ページが見つかりません。");
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    let response: Response;
    try { response = await route(request, env); }
    catch (error) {
      if (error instanceof ApiError) response = json({ error: error.message }, error.status);
      else {
        // Never log requests, cookies, private messages, photos, SQL values or session tokens.
        console.error("Yorutrade API operation failed");
        response = json({ error: "処理できませんでした。しばらくしてからお試しください。" }, 500);
      }
    }
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "private, no-store");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "no-referrer");
    headers.set("Vary", "Origin, Cookie");
    const origin = request.headers.get("Origin");
    if (origin && origins(env).includes(origin)) {
      headers.set("Access-Control-Allow-Origin", origin);
      headers.set("Access-Control-Allow-Credentials", "true");
      headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
      headers.set("Access-Control-Allow-Headers", "Content-Type");
    }
    if (response.status === 429) headers.set("Retry-After", "60");
    return new Response(response.body, { status: response.status, headers });
  },
  async scheduled(_event: ScheduledController, env: Env): Promise<void> {
    // Claim orphans atomically before removing objects. The trigger records keys for retry.
    await env.DB.prepare(`DELETE FROM images WHERE id IN (
      SELECT i.id FROM images i LEFT JOIN listings l ON l.image_id = i.id
      WHERE l.id IS NULL AND i.created_at < ? LIMIT 500
    )`).bind(Date.now() - 24 * 60 * 60 * 1000).run();
    const stale = await env.DB.prepare("SELECT object_key AS objectKey FROM r2_cleanup LIMIT 500")
      .all<{ objectKey: string }>();
    for (const image of stale.results) {
      await env.IMAGES.delete(image.objectKey);
      await env.DB.prepare("DELETE FROM r2_cleanup WHERE object_key = ?").bind(image.objectKey).run();
    }
    await env.DB.batch([
      env.DB.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(Math.floor(Date.now() / 1000)),
      env.DB.prepare("DELETE FROM rate_limits WHERE expires_at < ?").bind(Math.floor(Date.now() / 1000)),
    ]);
  },
} satisfies ExportedHandler<Env>;
