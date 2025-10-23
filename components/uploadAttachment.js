// utils/uploadAttachment.js
import { supabase } from "../supabaseClient";

/**
 * Upload file to Supabase storage and create metadata row.
 * @param {File} file browser File object
 * @param {String} userId
 * @param {Number|null} triggerId optional: associated trigger id
 * @returns metadata row or throws
 */
export async function uploadAttachment({ file, userId, triggerId = null }) {
  if (!file) throw new Error("No file provided");

  // Bucket and path
  const bucket = "deadman-uploads";
  const uniquePath = `${userId}/${Date.now()}_${file.name}`;

  // Upload
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(uniquePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  // Save metadata in table
  const { data: meta, error: metaError } = await supabase
    .from("deadman_attachments")
    .insert([
      {
        user_id: userId,
        trigger_id: triggerId,
        file_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        storage_path: uploadData.path,
        public: false,
      },
    ])
    .select()
    .single();

  if (metaError) {
    // try cleanup file if metadata failed
    await supabase.storage.from(bucket).remove([uploadData.path]).catch(() => {});
    throw metaError;
  }

  return meta;
}

/**
 * Get a signed URL (short-lived) for a private file
 * @param {String} path storage path (returned in metadata)
 * @param {Number} expires seconds
 */
export async function getSignedUrl(path, expires = 60) {
  const bucket = "deadman-uploads";
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expires);
  if (error) throw error;
  return data.signedUrl;
}
