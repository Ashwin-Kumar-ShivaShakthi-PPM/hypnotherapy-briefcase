// Client-side text extraction for .txt, .docx, .pdf files.

export type ExtractionOutcome =
  | { ok: true; text: string }
  | { ok: false; error: string };

export async function extractTextFromFile(
  file: File,
  onProgress?: (ratio: number) => void
): Promise<ExtractionOutcome> {
  const name = file.name.toLowerCase();
  try {
    if (name.endsWith(".txt") || file.type.startsWith("text/")) {
      onProgress?.(0.1);
      const text = await file.text();
      onProgress?.(1);
      return { ok: true, text };
    }

    if (name.endsWith(".docx")) {
      onProgress?.(0.2);
      const mammoth = (await import("mammoth")).default ?? (await import("mammoth"));
      const buffer = await file.arrayBuffer();
      onProgress?.(0.6);
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      onProgress?.(1);
      return { ok: true, text: result.value ?? "" };
    }

    if (name.endsWith(".pdf") || file.type === "application/pdf") {
      onProgress?.(0.1);
      // Use the legacy browser build which is stable and side-effect-free.
      const pdfjs: typeof import("pdfjs-dist") = await import(
        "pdfjs-dist/legacy/build/pdf.mjs"
      );
      // Disable the separate worker — runs on the main thread, simpler bundling.
      pdfjs.GlobalWorkerOptions.workerSrc = "";
      const buffer = await file.arrayBuffer();
      const doc = await pdfjs.getDocument({
        data: buffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        disableFontFace: true,
      }).promise;

      const pages: string[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item) =>
            "str" in item && typeof item.str === "string" ? item.str : ""
          )
          .join(" ");
        pages.push(pageText.trim());
        onProgress?.(Math.min(0.95, 0.1 + (0.85 * i) / doc.numPages));
      }
      await doc.cleanup();
      onProgress?.(1);
      return { ok: true, text: pages.join("\n\n") };
    }

    return {
      ok: false,
      error: "We support .txt, .docx, and .pdf files.",
    };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? `We couldn't read that file — ${err.message}`
          : "We couldn't read that file.",
    };
  }
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
