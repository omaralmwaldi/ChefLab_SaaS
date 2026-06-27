import { useRef, useState } from "react";
import { signUpload } from "../api/uploads";

const ACCEPT = {
  image: "image/jpeg,image/png,image/webp",
  video: "video/mp4,video/webm,video/quicktime",
};

const MAX_BYTES = {
  image: 10 * 1024 * 1024,
  video: 200 * 1024 * 1024,
};

function pickKind(file) {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return null;
}

function StepMediaUploader({ kind, value, onChange, disabled }) {
  const inputRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | signing | uploading | error
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  async function handleFile(file) {
    setError(null);
    const fileKind = pickKind(file);
    if (!fileKind || fileKind !== kind) {
      setError(`Expected a ${kind} file.`);
      return;
    }
    if (file.size > MAX_BYTES[kind]) {
      setError(
        `File too large. Max ${Math.round(MAX_BYTES[kind] / 1024 / 1024)} MB.`,
      );
      return;
    }

    try {
      setStatus("signing");
      const { uploadUrl, publicUrl } = await signUpload({
        contentType: file.type,
        sizeBytes: file.size,
        kind,
      });

      setStatus("uploading");
      setProgress(0);

      // XHR for upload progress; fetch has no progress events.
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300
            ? resolve()
            : reject(new Error(`Upload failed: ${xhr.status}`));
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(file);
      });

      setStatus("idle");
      setProgress(0);
      onChange(publicUrl);
    } catch (err) {
      setStatus("error");
      setError(err.message || "Upload failed");
    }
  }

  function clear() {
    onChange("");
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const busy = status === "signing" || status === "uploading";

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT[kind]}
          disabled={disabled || busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="block w-full text-xs text-stone-600 file:mr-2 file:cursor-pointer file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-stone-700 hover:file:bg-stone-200 disabled:opacity-50"
        />
        {value && (
          <button
            type="button"
            onClick={clear}
            disabled={disabled || busy}
            className="cursor-pointer rounded p-1 text-stone-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
            title="Remove"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {value && kind === "image" && (
        <img
          src={value}
          alt=""
          className="h-50 w-50 rounded border border-stone-200 object-cover"
        />
      )}
      {value && kind === "video" && (
        <video
          src={value}
          controls
          className="max-h-32 rounded border border-stone-200"
        />
      )}

      {status === "signing" && (
        <p className="text-xs text-stone-500">Signing URL...</p>
      )}
      {status === "uploading" && (
        <p className="text-xs text-stone-500">Uploading... {progress}%</p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default StepMediaUploader;
