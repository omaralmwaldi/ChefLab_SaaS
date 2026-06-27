const { z } = require("zod");

const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200 MB

const signSchema = z.object({
  contentType: z.string().refine(
    (v) => [...ALLOWED_IMAGE, ...ALLOWED_VIDEO].includes(v),
    "Unsupported content type",
  ),
  sizeBytes: z.number().int().positive(),
  kind: z.enum(["image", "video"]),
});

function maxBytesForKind(kind) {
  return kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
}

function extensionForContentType(contentType) {
  const map = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
  };
  return map[contentType] || "bin";
}

module.exports = {
  signSchema,
  maxBytesForKind,
  extensionForContentType,
  ALLOWED_IMAGE,
  ALLOWED_VIDEO,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
};
