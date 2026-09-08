import { supabase } from "@/lib/supabase";

/**
 * Sube una imagen local al bucket público `quincena-assets`, bajo
 * {userId}/{folder}/ — la política RLS de escritura exige que el primer
 * segmento de la ruta sea el uid del usuario. Devuelve la URL pública.
 */
export async function uploadPhoto(userId: string, localUri: string, folder: string): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const extension = localUri.split(".").pop()?.split("?")[0] || "jpg";
  const path = `${userId}/${folder}/${Date.now()}-${Math.round(Math.random() * 1e6)}.${extension}`;

  const { error } = await supabase.storage.from("quincena-assets").upload(path, blob, {
    contentType: blob.type || "image/jpeg",
  });
  if (error) throw error;

  const { data } = supabase.storage.from("quincena-assets").getPublicUrl(path);
  return data.publicUrl;
}
