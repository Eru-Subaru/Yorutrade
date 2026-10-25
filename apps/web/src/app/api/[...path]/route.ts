import { proxyApi } from "@/lib/api-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyApi(request, path, {
    workerUrl: process.env.CLOUDFLARE_API_URL,
    origin: process.env.APP_ORIGIN,
    secret: process.env.API_PROXY_SECRET,
    production: process.env.NODE_ENV === "production",
    vercel: process.env.VERCEL === "1",
  });
}

export { handle as GET, handle as POST, handle as PATCH, handle as DELETE, handle as HEAD };
