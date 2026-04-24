"use client";

import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useRef,
  useState,
} from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  ErrorMessage,
  PrimaryButton,
  SecondaryButton,
  Spinner,
  TextField,
} from "../ui/primitives";
import type { Id } from "../../convex/_generated/dataModel";
import {
  extractTextFromFile,
  formatBytes,
} from "../../lib/extractFileText";

type FileItem = {
  id: string;
  file: File;
  status: "queued" | "extracting" | "ready" | "error";
  progress: number;
  extractedText: string;
  error: string | null;
};

export function UploadTranscriptModal({
  open,
  onClose,
  clientId,
  episodeId,
  clientName,
  onProcessed,
}: {
  open: boolean;
  onClose: () => void;
  clientId: Id<"clients"> | null;
  episodeId: Id<"episodes"> | null;
  clientName: string;
  onProcessed: (recapId: Id<"sessionRecaps">) => void;
}) {
  const processTranscript = useAction(api.sessions.processTranscript);
  const [pastedText, setPastedText] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [sessionDate, setSessionDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  if (!open || !clientId) return null;

  const reset = () => {
    setPastedText("");
    setFiles([]);
    setSubmitting(false);
    setError(null);
  };

  const addFiles = async (incoming: FileList | File[]) => {
    const list = Array.from(incoming);
    if (list.length === 0) return;
    setError(null);

    const additions: FileItem[] = list.map((f) => ({
      id: `${Date.now()}-${f.name}-${Math.random().toString(36).slice(2, 8)}`,
      file: f,
      status: "queued",
      progress: 0,
      extractedText: "",
      error: null,
    }));

    setFiles((prev) => [...prev, ...additions]);

    for (const item of additions) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, status: "extracting", progress: 0.05 } : f
        )
      );
      const result = await extractTextFromFile(item.file, (ratio) => {
        setFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, progress: ratio } : f))
        );
      });
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? result.ok
              ? {
                  ...f,
                  status: "ready",
                  progress: 1,
                  extractedText: result.text,
                  error: null,
                }
              : {
                  ...f,
                  status: "error",
                  progress: 1,
                  extractedText: "",
                  error: result.error,
                }
            : f
        )
      );
    }
  };

  const onFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = "";
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer?.files) addFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) =>
    setFiles((prev) => prev.filter((f) => f.id !== id));

  const combinedTranscript = () => {
    const fileChunks = files
      .filter((f) => f.status === "ready" && f.extractedText.trim())
      .map(
        (f) =>
          `--- FILE: ${f.file.name} ---\n${f.extractedText.trim()}\n--- END FILE ---`
      );
    const parts: string[] = [];
    if (fileChunks.length > 0) parts.push(fileChunks.join("\n\n"));
    if (pastedText.trim()) {
      parts.push(
        fileChunks.length > 0
          ? `--- FILE: (pasted notes) ---\n${pastedText.trim()}\n--- END FILE ---`
          : pastedText.trim()
      );
    }
    return parts.join("\n\n");
  };

  const anyExtracting = files.some((f) => f.status === "extracting");
  const readyCount = files.filter((f) => f.status === "ready").length;
  const combined = combinedTranscript();
  const canSubmit =
    !submitting && !anyExtracting && combined.length > 0;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await processTranscript({
        clientId,
        episodeId: episodeId ?? undefined,
        transcriptText: combined,
        sessionDate: new Date(sessionDate).getTime(),
      });
      onProcessed(result.recapId);
      reset();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.replace(/^.*Error:\s*/, "")
          : "Something went wrong generating your session intelligence — please try again."
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-start sm:items-center justify-center p-4 sm:p-8 bg-[rgba(26,30,28,0.55)]">
      <div className="bg-paper border border-rule w-full max-w-[760px] max-h-[94vh] overflow-y-auto shadow-xl">
        <div className="px-6 sm:px-8 py-5 border-b border-rule flex items-center justify-between">
          <div>
            <h2 className="font-display text-[24px] text-ink">
              Upload session transcript
            </h2>
            <p className="text-[13px] text-ink-muted mt-1">For {clientName}</p>
          </div>
          <button
            onClick={() => {
              reset();
              onClose();
            }}
            className="text-ink-muted hover:text-ink"
            aria-label="Close"
            disabled={submitting}
          >
            ×
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="px-6 sm:px-8 py-6 space-y-6 bg-paper-card"
        >
          <TextField
            id="session-date"
            label="Session date"
            type="date"
            required
            value={sessionDate}
            onChange={setSessionDate}
            disabled={submitting}
          />

          <div>
            <p className="block text-[11px] tracking-[0.12em] uppercase font-semibold text-ink-muted mb-2">
              Session files
            </p>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-none px-5 py-8 text-center cursor-pointer transition-colors ${
                dragOver
                  ? "border-teal bg-teal-soft/60"
                  : "border-rule bg-paper hover:border-teal"
              }`}
            >
              <p className="text-[15px] text-ink">
                Drop files here, or{" "}
                <span className="text-teal underline">browse</span>
              </p>
              <p className="mt-2 text-[13px] text-ink-muted">
                .pdf, .docx, .txt — multiple files supported. We analyse them
                all together.
              </p>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={onFileInput}
                className="hidden"
                disabled={submitting}
              />
            </div>

            {files.length > 0 && (
              <ul className="mt-4 space-y-2">
                {files.map((f) => (
                  <li
                    key={f.id}
                    className={`border px-4 py-3 flex items-center gap-3 ${
                      f.status === "error"
                        ? "border-[#c9695a] bg-[#fce8e3]"
                        : f.status === "ready"
                          ? "border-teal/50 bg-teal-soft/40"
                          : "border-rule bg-paper"
                    }`}
                  >
                    <FileIcon />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] text-ink truncate">
                        {f.file.name}
                      </p>
                      <p className="text-[12px] text-ink-muted mt-0.5">
                        {formatBytes(f.file.size)}
                        {f.status === "extracting" && " · Reading…"}
                        {f.status === "ready" &&
                          ` · ${f.extractedText.trim().length.toLocaleString()} characters read`}
                        {f.status === "error" && ` · ${f.error}`}
                      </p>
                      {f.status === "extracting" && (
                        <div className="mt-2 h-[3px] bg-rule overflow-hidden">
                          <div
                            className="h-full bg-teal transition-all"
                            style={{ width: `${Math.round(f.progress * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(f.id)}
                      className="text-ink-muted hover:text-ink text-lg shrink-0"
                      aria-label={`Remove ${f.file.name}`}
                      disabled={submitting}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label
              htmlFor="pasted"
              className="block text-[11px] tracking-[0.12em] uppercase font-semibold text-ink-muted mb-2"
            >
              Or paste transcript text
            </label>
            <textarea
              id="pasted"
              rows={8}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste any additional notes or a full transcript here. Combined with any files above."
              disabled={submitting}
              className="w-full px-4 py-3 bg-paper border border-rule rounded-none text-[15px] text-ink placeholder:text-ink-faint focus:outline-none focus:border-teal transition-colors disabled:opacity-60 leading-relaxed"
            />
          </div>

          {submitting && (
            <div className="border border-rule bg-teal-soft/50 px-5 py-4">
              <Spinner label="Analysing session — generating intelligence across all files…" />
            </div>
          )}

          <ErrorMessage>{error}</ErrorMessage>
          <p className="text-[13px] text-ink-muted">
            Your data is private and encrypted. Files are read in your browser —
            only the extracted text is sent to generate intelligence.
          </p>
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-[13px] text-ink-muted">
              {readyCount > 0 && (
                <>
                  {readyCount} file{readyCount === 1 ? "" : "s"} ready
                  {pastedText.trim() && " · plus pasted notes"}
                </>
              )}
              {readyCount === 0 && pastedText.trim() && "Pasted notes ready"}
              {readyCount === 0 && !pastedText.trim() && "Add a file or paste text to continue"}
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <SecondaryButton
                onClick={() => {
                  reset();
                  onClose();
                }}
                disabled={submitting}
              >
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit" disabled={!canSubmit}>
                {submitting
                  ? "Processing…"
                  : anyExtracting
                    ? "Reading files…"
                    : "Process session"}
              </PrimaryButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function FileIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-ink-muted shrink-0"
      aria-hidden
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}
