import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import worker, { type Env } from "../src/worker.ts";

let mf: Miniflare;
let env: Env;
const origin = "https://yorutrade.vercel.app";
const secret = "test-only-proxy-secret-with-at-least-32-characters";

before(async () => {
  mf = new Miniflare(convertV4MiniflareOptions({
    modules: true,
    script: "export default { fetch() { return new Response('test'); } };",
    compatibilityDate: "2026-10-01",
    d1Databases: { DB: "yorutrade-test" },
    r2Buckets: { IMAGES: "yorutrade-test-images" },
  }));
  env = {
    DB: await mf.getD1Database("DB"), IMAGES: await mf.getR2Bucket("IMAGES"),
    ALLOWED_ORIGINS: origin, API_PROXY_SECRET: secret,
  } as Env;
  const schema = await readFile(new URL("../migrations/0001_initial.sql", import.meta.url), "utf8");
  // Preserve complete trigger bodies while sending each SQL statement to D1.
  let sql = "", trigger = false;
  for (const line of schema.split(/\r?\n/)) {
    sql += `${line}\n`;
    if (line.startsWith("CREATE TRIGGER")) trigger = true;
    if (trigger ? line === "END;" : line.trim().endsWith(";")) {
      await env.DB.prepare(sql.trim()).run();
      sql = ""; trigger = false;
    }
  }
});

after(async () => { await mf?.dispose(); });

async function call(path: string, cookie = "", method = "GET", body?: unknown, extra?: Record<string, string>) {
  const headers: Record<string, string> = {
    Origin: origin, "X-Yorutrade-Proxy-Secret": secret,
    "X-Yorutrade-Client-IP": "203.0.113.42", ...extra,
  };
  if (cookie) headers.Cookie = cookie;
  let requestBody: string | Uint8Array | undefined;
  if (body instanceof Uint8Array) requestBody = body;
  else if (body !== undefined) { requestBody = JSON.stringify(body); headers["Content-Type"] = "application/json"; }
  const response = await worker.fetch(new Request(`https://worker.test${path}`, {
    method, headers, ...(requestBody === undefined ? {} : { body: requestBody }),
  }), env);
  const result = response.headers.get("Content-Type")?.includes("application/json") ? await response.json() : null;
  return { response, result: result as Record<string, any> };
}

async function person(ip: string) {
  const { response, result } = await call("/api/session", "", "GET", undefined, { "X-Yorutrade-Client-IP": ip });
  assert.equal(response.status, 200);
  const cookie = response.headers.get("Set-Cookie")?.split(";")[0] ?? "";
  assert.match(cookie, /^yt_session=[a-f0-9]{64}$/);
  assert.match(response.headers.get("Set-Cookie") ?? "", /HttpOnly; SameSite=Lax/);
  assert.match(response.headers.get("Set-Cookie") ?? "", /Secure/);
  return { cookie, id: result.user.id as string };
}

async function listing(cookie: string, have: string, want: string, event = crypto.randomUUID(), imageId?: string) {
  const { response, result } = await call("/api/listings", cookie, "POST", {
    title: have, have, want, category: "goods", event, notes: "", ...(imageId ? { imageId } : {}),
  });
  assert.equal(response.status, 201, JSON.stringify(result));
  return result.listing;
}

test("production rejects missing proxy credentials, cross-origin writes and unauthenticated writes", async () => {
  const missing = await worker.fetch(new Request("https://worker.test/api/listings"), env);
  assert.equal(missing.status, 403);
  const noConfig = await worker.fetch(new Request("https://worker.test/api/listings"), { ...env, API_PROXY_SECRET: "" });
  assert.equal(noConfig.status, 503);
  const cross = await call("/api/listings", "", "POST", {}, { Origin: "https://attacker.example" });
  assert.equal(cross.response.status, 403);
  assert.equal(cross.response.headers.get("Access-Control-Allow-Origin"), null);
  const anonymous = await call("/api/listings", "", "POST", {});
  assert.equal(anonymous.response.status, 401);
});

test("starts without fake data, creates hashed browser sessions, and ignores forged client identities", async () => {
  assert.deepEqual((await call("/api/listings")).result.listings, []);
  const a = await person("203.0.113.1");
  const stored = await env.DB.prepare("SELECT token_hash FROM sessions WHERE user_id = ?").bind(a.id).first<{ token_hash: string }>();
  assert.notEqual(stored?.token_hash, a.cookie.split("=")[1]);
  const data = await call("/api/session", a.cookie);
  assert.equal(data.result.user.id, a.id);
  const update = await call("/api/session", a.cookie, "PATCH", { displayName: "月の個体さん", userId: "forged" });
  assert.equal(update.result.user.id, a.id);
  assert.equal(update.result.user.displayName, "月の個体さん");
});

test("requires another owner, reciprocal items, matching category and event, then recipient agreement", async () => {
  const a = await person("203.0.113.2"), b = await person("203.0.113.3"), stranger = await person("203.0.113.4");
  const event = "仙台 2026";
  const aItem = await listing(a.cookie, "猫", "月", event);
  const ownOther = await listing(a.cookie, "月", "猫", event);
  const bItem = await listing(b.cookie, "月", "猫", "仙台　2026");
  const invalid = await listing(b.cookie, "星", "猫", event);
  const wrongEvent = await listing(b.cookie, "月", "猫", "東京");
  for (const target of [ownOther, invalid, wrongEvent]) {
    assert.equal((await call("/api/matches", a.cookie, "POST", { listingId: target.id, offeredListingId: aItem.id })).response.status, 409);
  }
  const proposal = await call("/api/matches", a.cookie, "POST", { listingId: bItem.id, offeredListingId: aItem.id });
  assert.equal(proposal.response.status, 201);
  const id = proposal.result.match.id;
  assert.equal((await call(`/api/matches/${id}/messages`, a.cookie)).response.status, 403);
  assert.equal((await call(`/api/matches/${id}`, a.cookie, "PATCH", { status: "accepted" })).response.status, 403);
  assert.equal((await call(`/api/matches/${id}`, stranger.cookie, "PATCH", { status: "accepted" })).response.status, 404);
  assert.deepEqual((await call("/api/matches", stranger.cookie)).result.matches, []);
  assert.equal((await call(`/api/matches/${id}`, b.cookie, "PATCH", { status: "accepted" })).response.status, 200);
  assert.equal((await call(`/api/matches/${id}/messages`, stranger.cookie)).response.status, 404);
  const sent = await call(`/api/matches/${id}/messages`, a.cookie, "POST", { text: "会場でよろしくお願いします", senderId: stranger.id });
  assert.equal(sent.response.status, 201);
  assert.equal(sent.result.message.senderId, a.id);
  const received = await call(`/api/matches/${id}/messages`, b.cookie);
  assert.equal(received.result.messages[0].text, "会場でよろしくお願いします");
  const listed = (await call("/api/listings")).result.listings;
  assert.ok(!listed.some((item: { id: string }) => item.id === aItem.id || item.id === bItem.id));
});

test("atomic acceptance reserves shared items and declines competing proposals", async () => {
  const a = await person("203.0.113.5"), b = await person("203.0.113.6"), c = await person("203.0.113.7");
  const event = crypto.randomUUID();
  const shared = await listing(a.cookie, "pick-a", "pick-b", event);
  const otherB = await listing(b.cookie, "pick-b", "pick-a", event);
  const otherC = await listing(c.cookie, "pick-b", "pick-a", event);
  const first = await call("/api/matches", a.cookie, "POST", { listingId: otherB.id, offeredListingId: shared.id });
  const second = await call("/api/matches", a.cookie, "POST", { listingId: otherC.id, offeredListingId: shared.id });
  const answers = await Promise.all([
    call(`/api/matches/${first.result.match.id}`, b.cookie, "PATCH", { status: "accepted" }),
    call(`/api/matches/${second.result.match.id}`, c.cookie, "PATCH", { status: "accepted" }),
  ]);
  assert.deepEqual(answers.map((answer) => answer.response.status).sort(), [200, 409]);
  const matches = (await call("/api/matches", a.cookie)).result.matches;
  assert.equal(matches.filter((match: { status: string }) => match.status === "accepted").length, 1);
  assert.equal(matches.filter((match: { status: string }) => match.status === "declined").length, 1);
});

test("expired listings cannot be accepted even after a proposal was created", async () => {
  const a = await person("203.0.113.8"), b = await person("203.0.113.9");
  const event = crypto.randomUUID();
  const aItem = await listing(a.cookie, "A", "B", event), bItem = await listing(b.cookie, "B", "A", event);
  const proposal = await call("/api/matches", a.cookie, "POST", { listingId: bItem.id, offeredListingId: aItem.id });
  await env.DB.prepare("UPDATE listings SET created_at = 0 WHERE id IN (?, ?)").bind(aItem.id, bItem.id).run();
  assert.equal((await call(`/api/matches/${proposal.result.match.id}`, b.cookie, "PATCH", { status: "accepted" })).response.status, 409);
});

test("uploads validate signatures and ownership; unpublished and expired photos stay private", async () => {
  const a = await person("203.0.113.10"), b = await person("203.0.113.11");
  const fake = await call("/api/images", a.cookie, "POST", new TextEncoder().encode("<svg></svg>"), { "Content-Type": "image/png" });
  assert.equal(fake.response.status, 415);
  const svg = await call("/api/images", a.cookie, "POST", new TextEncoder().encode("<svg></svg>"), { "Content-Type": "image/svg+xml" });
  assert.equal(svg.response.status, 415);
  const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0]);
  const upload = await call("/api/images", a.cookie, "POST", bytes, { "Content-Type": "image/png" });
  assert.equal(upload.response.status, 201);
  const imageId = upload.result.imageId;
  assert.equal((await call(`/api/images/${imageId}`, b.cookie)).response.status, 404);
  assert.equal((await call(`/api/images/${imageId}`, a.cookie)).response.status, 200);
  const stolen = await call("/api/listings", b.cookie, "POST", { title: "A", have: "A", want: "B", category: "goods", event: "test", imageId });
  assert.equal(stolen.response.status, 403);
  const item = await listing(a.cookie, "photo item", "other", crypto.randomUUID(), imageId);
  const publicImage = await call(`/api/images/${imageId}`);
  assert.equal(publicImage.response.status, 200);
  assert.equal(publicImage.response.headers.get("X-Content-Type-Options"), "nosniff");
  await env.DB.prepare("UPDATE listings SET created_at = 0 WHERE id = ?").bind(item.id).run();
  assert.equal((await call(`/api/images/${imageId}`, b.cookie)).response.status, 404);
  assert.equal((await call(`/api/images/${imageId}`, a.cookie)).response.status, 200);
  const oversize = await call("/api/images", a.cookie, "POST", new Uint8Array(5 * 1024 * 1024 + 1), { "Content-Type": "image/png" });
  assert.equal(oversize.response.status, 413);
});

test("bounded input and shared durable session quotas resist basic abuse", async () => {
  const a = await person("203.0.113.12");
  const huge = await call("/api/listings", a.cookie, "POST", { title: "x".repeat(20000) });
  assert.equal(huge.response.status, 413);
  const tooLong = await call("/api/session", a.cookie, "PATCH", { displayName: "x".repeat(41) });
  assert.equal(tooLong.response.status, 400);
  const spoof = await call("/api/session", "yt_session=forged-token", "PATCH", { displayName: "attacker" });
  assert.equal(spoof.response.status, 401);
  const statuses = [];
  for (let i = 0; i < 21; i++) statuses.push((await call("/api/session", "", "GET", undefined, { "X-Yorutrade-Client-IP": "198.51.100.77" })).response.status);
  assert.equal(statuses.at(-1), 429);
});

test("matched photos are visible only to owner and accepted partner, and orphan cleanup retries", async () => {
  const a = await person("203.0.113.13"), b = await person("203.0.113.14"), stranger = await person("203.0.113.15");
  const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0]);
  const upload = await call("/api/images", a.cookie, "POST", bytes, { "Content-Type": "image/png" });
  const imageId = upload.result.imageId;
  const event = crypto.randomUUID();
  const aItem = await listing(a.cookie, "photo-a", "photo-b", event, imageId);
  const bItem = await listing(b.cookie, "photo-b", "photo-a", event);
  const proposed = await call("/api/matches", a.cookie, "POST", { listingId: bItem.id, offeredListingId: aItem.id });
  await call(`/api/matches/${proposed.result.match.id}`, b.cookie, "PATCH", { status: "accepted" });
  assert.equal((await call(`/api/images/${imageId}`, a.cookie)).response.status, 200);
  assert.equal((await call(`/api/images/${imageId}`, b.cookie)).response.status, 200);
  assert.equal((await call(`/api/images/${imageId}`, stranger.cookie)).response.status, 404);
  assert.equal((await call(`/api/images/${imageId}`)).response.status, 404);

  const orphan = await call("/api/images", a.cookie, "POST", bytes, { "Content-Type": "image/png" });
  const orphanId = orphan.result.imageId;
  await env.DB.prepare("UPDATE images SET created_at = 0 WHERE id = ?").bind(orphanId).run();
  const failingBucket = { delete: async () => { throw new Error("simulated R2 outage"); } } as unknown as R2Bucket;
  await assert.rejects(worker.scheduled({} as ScheduledController, { ...env, IMAGES: failingBucket }));
  assert.equal(await env.DB.prepare("SELECT id FROM images WHERE id = ?").bind(orphanId).first(), null);
  assert.ok(await env.DB.prepare("SELECT object_key FROM r2_cleanup WHERE object_key = ?").bind(`uploads/${orphanId}`).first());
  await worker.scheduled({} as ScheduledController, env);
  assert.equal(await env.IMAGES.get(`uploads/${orphanId}`), null);
  assert.equal(await env.DB.prepare("SELECT object_key FROM r2_cleanup WHERE object_key = ?").bind(`uploads/${orphanId}`).first(), null);
  assert.ok(await env.IMAGES.get(`uploads/${imageId}`));
});
