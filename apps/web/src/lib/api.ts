export type User = { id: string; displayName: string };
export type Listing = {
  id: string; ownerId: string; displayName: string; title: string;
  have: string; want: string; category: "goods" | "pick"; event: string;
  notes: string; imageId: string | null; createdAt: number;
};
export type Match = {
  id: string; status: "pending" | "accepted" | "declined";
  initiatorId: string; recipientId: string; listingId: string;
  offeredListingId: string; listingTitle: string; offeredTitle: string;
  partnerName: string; createdAt: number;
};
export type Message = { id: string; senderId: string; text: string; createdAt: number };

let sessionRequest: Promise<unknown> | undefined;

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!path.startsWith("/") || path.startsWith("//")) throw new Error("リクエストが正しくありません。");
  const run = async () => {
    const headers = new Headers(options.headers);
    if (typeof options.body === "string") headers.set("Content-Type", "application/json");
    const response = await fetch(`/api${path}`, { ...options, headers, credentials: "same-origin", cache: "no-store" });
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.error || "接続できませんでした。時間をおいて再度お試しください。");
    return result as T;
  };
  // A shared first request prevents concurrent components from creating different identities.
  if (path === "/session" && (!options.method || options.method === "GET")) {
    if (!sessionRequest) sessionRequest = run().finally(() => { sessionRequest = undefined; });
    return sessionRequest as Promise<T>;
  }
  return run();
}

export async function uploadImage(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("写真は JPEG・PNG・WebP 形式を選んでください。");
  }
  if (file.size > 10 * 1024 * 1024) throw new Error("写真は10MB以下で選んでください。");
  // Re-encode pixels to remove EXIF location metadata and bound the uploaded dimensions.
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  let photo: Blob;
  try {
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("写真を読み込めませんでした。");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    photo = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error("写真を読み込めませんでした。")), "image/jpeg", 0.85,
    ));
  } finally { bitmap.close(); }
  if (photo.size > 4 * 1024 * 1024) throw new Error("写真を小さくして再度お試しください。");
  const { imageId } = await api<{ imageId: string }>("/images", { method: "POST", body: photo, headers: { "Content-Type": photo.type } });
  return imageId;
}
