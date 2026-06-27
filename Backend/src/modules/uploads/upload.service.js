const { randomUUID } = require("crypto");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {
  r2,
  R2_BUCKET,
  R2_PUBLIC_BASE,
} = require("../../config/r2");
const { extensionForContentType, maxBytesForKind } = require("./upload.validation");

const SIGN_EXPIRES_SECONDS = 60 * 5; // 5 minutes

async function signUpload({ organizationId, contentType, sizeBytes, kind }) {
  const max = maxBytesForKind(kind);
  if (sizeBytes > max) {
    const err = new Error(
      `File too large. Max ${kind} size is ${Math.round(max / 1024 / 1024)} MB`,
    );
    err.status = 413;
    throw err;
  }

  const ext = extensionForContentType(contentType);
  const key = `steps/${organizationId}/${randomUUID()}.${ext}`;
  const publicUrl = `${R2_PUBLIC_BASE.replace(/\/$/, "")}/${key}`;

  const cmd = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: sizeBytes,
  });

  const uploadUrl = await getSignedUrl(r2, cmd, {
    expiresIn: SIGN_EXPIRES_SECONDS,
  });

  return { uploadUrl, publicUrl, key, expiresIn: SIGN_EXPIRES_SECONDS };
}

module.exports = { signUpload };
