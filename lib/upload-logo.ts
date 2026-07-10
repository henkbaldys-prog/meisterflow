import { supabase } from "@/lib/supabase";

const BUCKET = "firmen-logos";
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function extensionForMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[mime] || "png";
}

export async function uploadFirmenLogo(
  file: File,
  userId: string,
): Promise<{ url: string | null; error: Error | null }> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { url: null, error: new Error("Nur JPG, PNG, WebP oder GIF erlaubt") };
  }
  if (file.size > MAX_BYTES) {
    return { url: null, error: new Error("Logo zu groß – maximal 2 MB") };
  }

  const ext = extensionForMime(file.type);
  const path = `${userId}/logo.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });

  if (uploadError) {
    const msg = uploadError.message.includes("Bucket not found")
      ? "Storage-Bucket fehlt – bitte supabase/firmen-logos-storage.sql ausführen"
      : uploadError.message;
    return { url: null, error: new Error(msg) };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: `${data.publicUrl}?t=${Date.now()}`, error: null };
}

export async function removeFirmenLogo(userId: string): Promise<{ error: Error | null }> {
  const { data: files, error: listError } = await supabase.storage.from(BUCKET).list(userId);

  if (listError) {
    if (listError.message.includes("Bucket not found")) {
      return { error: new Error("Storage-Bucket fehlt – bitte supabase/firmen-logos-storage.sql ausführen") };
    }
    return { error: new Error(listError.message) };
  }

  if (!files?.length) return { error: null };

  const paths = files.map((f) => `${userId}/${f.name}`);
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  return { error: error ? new Error(error.message) : null };
}
