import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";

/** Supabase Storage: bucket privado "sdm"; arquivos só por URL assinada. */
export const BUCKET = "sdm";
let pronto = false;

async function garantirBucket() {
  if (pronto) return;
  const sb = supabaseAdmin();
  const { data } = await sb.storage.getBucket(BUCKET);
  if (!data) await sb.storage.createBucket(BUCKET, { public: false, fileSizeLimit: 10 * 1024 * 1024 });
  pronto = true;
}

export async function salvarArquivo(path: string, body: ArrayBuffer | Blob, contentType: string) {
  await garantirBucket();
  const { error } = await supabaseAdmin().storage.from(BUCKET).upload(path, body, { contentType, upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

export async function urlsAssinadas(paths: string[], segundos = 3600): Promise<Record<string, string>> {
  if (!paths.length) return {};
  const { data } = await supabaseAdmin().storage.from(BUCKET).createSignedUrls(paths, segundos);
  return Object.fromEntries((data ?? []).filter((d) => d.signedUrl && d.path).map((d) => [d.path!, d.signedUrl as string]));
}

export async function apagarArquivo(path: string) {
  await supabaseAdmin().storage.from(BUCKET).remove([path]);
}

export async function baixarArquivo(path: string) {
  const { data, error } = await supabaseAdmin().storage.from(BUCKET).download(path);
  if (error || !data) throw new Error(error?.message ?? "arquivo não encontrado");
  return data;
}
