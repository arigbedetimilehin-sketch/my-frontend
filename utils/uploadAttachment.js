import { supabase } from "../supabaseClient";

export async function uploadAttachment(userId, triggerId, file) {
  const filePath = `${userId}/${triggerId}/${Date.now()}_${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("deadman_attachments")
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: fileInfo } = await supabase.storage
    .from("deadman_attachments")
    .getPublicUrl(filePath);

  const { error: insertError } = await supabase
    .from("deadman_attachments")
    .insert([
      {
        user_id: userId,
        trigger_id: triggerId,
        file_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        storage_path: filePath,
        public: true,
      },
    ]);

  if (insertError) throw insertError;
  return fileInfo.publicUrl;
}
