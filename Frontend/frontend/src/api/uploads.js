import client from "./client";

// Ask backend for a presigned R2 PUT URL.
// kind: 'image' | 'video'
export async function signUpload({ contentType, sizeBytes, kind }) {
  const { data } = await client.post("/uploads/sign", {
    contentType,
    sizeBytes,
    kind,
  });
  return data; // { uploadUrl, publicUrl, key, expiresIn }
}
