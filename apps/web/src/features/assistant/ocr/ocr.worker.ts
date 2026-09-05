// apps/web/src/features/assistant/ocr/ocr.worker.ts
// Phase 7 — Client-only OCR Web Worker
// Decision D-030: NEVER upload image data to server. All processing 100% in-browser.
// Runs off the main thread via dedicated Worker. Zero network I/O for OCR.

import { createWorker } from "tesseract.js";

// ============================================================================
// Message protocol types (shared via postMessage)
// ============================================================================

export type OCRWorkerInMessage =
  | { type: "PROCESS"; imageData: ImageData; jobId: string }
  | { type: "TERMINATE" };

export type OCRWorkerOutMessage =
  | { type: "PROGRESS"; jobId: string; status: string; progress: number }
  | { type: "RESULT"; jobId: string; lines: string[]; rawText: string }
  | { type: "ERROR"; jobId: string; message: string }
  | { type: "READY" };

// ============================================================================
// Image preprocessing — grayscale + contrast boost for HSR card backgrounds
// Pre-processing happens on the worker thread to keep main thread responsive.
// ============================================================================

/**
 * Apply grayscale + contrast boost to ImageData.
 * Improves OCR accuracy on white/gold HSR card text over cosmic backgrounds.
 */
function preprocessPixels(src: ImageData): Uint8ClampedArray {
  const data = new Uint8ClampedArray(src.data);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    const contrast = Math.min(255, Math.max(0, Math.round((gray - 128) * 1.5 + 128)));
    data[i] = contrast;
    data[i + 1] = contrast;
    data[i + 2] = contrast;
  }
  return data;
}

/**
 * Draw preprocessed ImageData onto an OffscreenCanvas and return the canvas.
 * tesseract.js v7 accepts OffscreenCanvas as ImageLike.
 */
function imageDataToOffscreenCanvas(src: ImageData): OffscreenCanvas {
  const canvas = new OffscreenCanvas(src.width, src.height);
  const ctx = canvas.getContext("2d")!;
  const processed = preprocessPixels(src);
  // Copy into a standard ArrayBuffer to satisfy ImageData constructor types
  const buffer = new ArrayBuffer(processed.byteLength);
  const view = new Uint8ClampedArray(buffer);
  view.set(processed);
  const out = new ImageData(view, src.width, src.height);
  ctx.putImageData(out, 0, 0);
  return canvas;
}

// ============================================================================
// Worker main
// ============================================================================

let tesseractWorker: Awaited<ReturnType<typeof createWorker>> | null = null;

async function initTesseract(jobId: string): Promise<void> {
  if (tesseractWorker) return;

  self.postMessage({
    type: "PROGRESS",
    jobId,
    status: "loading_engine",
    progress: 0.05,
  } satisfies OCRWorkerOutMessage);

  tesseractWorker = await createWorker("eng", 1, {
    logger: (m: { status: string; progress: number }) => {
      self.postMessage({
        type: "PROGRESS",
        jobId,
        status: m.status.includes("recognizing") ? "recognizing"
          : m.status.includes("loading") ? "loading_engine"
          : "initializing",
        progress: Math.min(0.95, m.progress),
      } satisfies OCRWorkerOutMessage);
    },
  });
}

async function processImage(jobId: string, imageData: ImageData): Promise<void> {
  try {
    self.postMessage({
      type: "PROGRESS",
      jobId,
      status: "initializing",
      progress: 0.1,
    } satisfies OCRWorkerOutMessage);

    await initTesseract(jobId);

    self.postMessage({
      type: "PROGRESS",
      jobId,
      status: "recognizing",
      progress: 0.5,
    } satisfies OCRWorkerOutMessage);

    // Convert ImageData to OffscreenCanvas (accepted by tesseract.js v7)
    const canvas = imageDataToOffscreenCanvas(imageData);
    const result = await tesseractWorker!.recognize(canvas);

    self.postMessage({
      type: "PROGRESS",
      jobId,
      status: "extracting_text",
      progress: 0.9,
    } satisfies OCRWorkerOutMessage);

    // Extract lines from raw text — split on newlines, filter noise
    const rawText = result.data.text;
    const lines = rawText
      .split("\n")
      .map((l) => l.trim())
      .filter((t) => t.length >= 3);

    self.postMessage({
      type: "PROGRESS",
      jobId,
      status: "done",
      progress: 1.0,
    } satisfies OCRWorkerOutMessage);

    self.postMessage({
      type: "RESULT",
      jobId,
      lines,
      rawText,
    } satisfies OCRWorkerOutMessage);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    self.postMessage({
      type: "ERROR",
      jobId,
      message: `OCR processing failed: ${message}`,
    } satisfies OCRWorkerOutMessage);
  }
}

// ============================================================================
// Message handler
// ============================================================================

self.onmessage = async (event: MessageEvent<OCRWorkerInMessage>) => {
  const msg = event.data;

  if (msg.type === "PROCESS") {
    await processImage(msg.jobId, msg.imageData);
  } else if (msg.type === "TERMINATE") {
    if (tesseractWorker) {
      await tesseractWorker.terminate();
      tesseractWorker = null;
    }
    self.close();
  }
};

// Signal ready
self.postMessage({ type: "READY" } satisfies OCRWorkerOutMessage);
