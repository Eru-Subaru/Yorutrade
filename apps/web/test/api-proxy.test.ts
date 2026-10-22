import assert from "node:assert/strict";
import { test } from "node:test";
import { proxyApi } from "../src/lib/api-proxy";

const config = { workerUrl: "https://api.example.workers.dev", origin: "https://yorutrade.example", secret: "a".repeat(48), production: true, vercel: true };

test("proxy fails closed without production credentials or HTTPS", async () => {
  const request = new Request("https://yorutrade.example/api/session");
  assert.equal((await proxyApi(request, ["session"], { ...config, secret: undefined })).status, 503);
  assert.equal((await proxyApi(request, ["session"], { ...config, workerUrl: "http://api.example" })).status, 503);
});

test("proxy rejects missing/foreign write origins and cross-site session requests", async () => {
  for (const origin of [undefined, "https://evil.example"]) {
    const headers = origin ? { origin } : undefined;
    assert.equal((await proxyApi(new Request("https://yorutrade.example/api/listings", { method: "POST", headers }), ["listings"], config)).status, 403);
  }
  assert.equal((await proxyApi(new Request("https://yorutrade.example/api/session", { headers: { "sec-fetch-site": "cross-site" } }), ["session"], config)).status, 403);
});

test("proxy never accepts a caller-controlled upstream path", async () => {
  for (const path of [["..", "admin"], ["https:", "evil.example"], ["images", ".."], ["listings?redirect=https://evil.example"]]) {
    assert.equal((await proxyApi(new Request("https://yorutrade.example/api/session"), path, config)).status, 404);
  }
});

test("proxy caps both declared and streamed request sizes", async () => {
  const options = { method: "POST", headers: { origin: config.origin, "content-length": "5000000" } };
  assert.equal((await proxyApi(new Request("https://yorutrade.example/api/images", options), ["images"], config)).status, 413);
  const request = new Request("https://yorutrade.example/api/images", { method: "POST", headers: { origin: config.origin }, body: new Uint8Array(4 * 1024 * 1024 + 1) });
  assert.equal((await proxyApi(request, ["images"], config)).status, 413);
});

test("proxy forwards only the session and trusted server headers, preserves cookies without caching", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, options) => {
    assert.equal(String(input), "https://api.example.workers.dev/api/session");
    const headers = new Headers(options?.headers);
    assert.equal(headers.get("Cookie"), "yt_session=abc_123-DEF");
    assert.equal(headers.get("Authorization"), null);
    assert.equal(headers.get("X-Yorutrade-Proxy-Secret"), config.secret);
    assert.equal(headers.get("X-Yorutrade-Client-IP"), "203.0.113.1");
    assert.equal(options?.redirect, "error");
    return Response.json({ user: { id: "u1" } }, { headers: { "set-cookie": "yt_session=new-token; HttpOnly; Secure; SameSite=Lax; Path=/", "x-internal-secret": "hidden" } });
  };
  try {
    const response = await proxyApi(new Request("https://yorutrade.example/api/session", { headers: {
      cookie: "unrelated=private; yt_session=abc_123-DEF", authorization: "Bearer attacker",
      "x-yorutrade-proxy-secret": "attacker", "x-yorutrade-client-ip": "attacker", "x-vercel-forwarded-for": "203.0.113.1",
    } }), ["session"], config);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("Cache-Control")!, /no-store/);
    assert.match(response.headers.get("set-cookie")!, /HttpOnly/);
    assert.equal(response.headers.get("x-internal-secret"), null);
  } finally { globalThis.fetch = originalFetch; }
});

test("upstream failures do not expose credentials or internal details", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error(`secret=${config.secret}`); };
  try {
    const response = await proxyApi(new Request("https://yorutrade.example/api/session"), ["session"], config);
    assert.equal(response.status, 502);
    assert.equal((await response.text()).includes(config.secret), false);
  } finally { globalThis.fetch = originalFetch; }
});
