import { randomUUID } from "node:crypto";

const SIDECAR = "http://127.0.0.1:1106";

function privateLocation(objectPath: string) {
  const base = process.env.PRIVATE_OBJECT_DIR;
  if (!base) throw new Error("Penyimpanan objek belum dikonfigurasi");
  if (!objectPath.startsWith("/objects/uploads/")) throw new Error("Lokasi berkas tidak valid");
  const parts = base.replace(/^\/|\/$/g, "").split("/");
  return {
    bucketName: parts.shift()!,
    objectName: `${parts.join("/")}/uploads/${objectPath.split("/").pop()}`.replace(/^\//, ""),
  };
}

async function signedUrl(bucketName: string, objectName: string, method: "GET" | "PUT") {
  const response = await fetch(`${SIDECAR}/object-storage/signed-object-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bucket_name: bucketName,
      object_name: objectName,
      method,
      expires_at: new Date(Date.now() + 15 * 60_000).toISOString(),
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Gagal membuat URL penyimpanan (${response.status})`);
  const body = await response.json() as { signed_url: string };
  return body.signed_url;
}

export async function createReferenceUploadTarget(organizationId: number) {
  const objectPath = `/objects/uploads/org-${organizationId}-${randomUUID()}`;
  const location = privateLocation(objectPath);
  return { objectPath, uploadURL: await signedUrl(location.bucketName, location.objectName, "PUT") };
}

export async function downloadReferenceObject(objectPath: string, maxBytes: number) {
  const location = privateLocation(objectPath);
  const url = await signedUrl(location.bucketName, location.objectName, "GET");
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`Berkas unggahan tidak dapat dibaca (${response.status})`);
  const declaredSize = Number(response.headers.get("content-length") || 0);
  if (declaredSize > maxBytes) throw new Error("Ukuran berkas sebenarnya melebihi 20 MB");
  if (!response.body) throw new Error("Berkas unggahan kosong");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error("Ukuran berkas sebenarnya melebihi 20 MB");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), total);
}