// apps/web/src/features/assistant/ocr/use-ocr.ts
// Phase 7 — React hook for OCR Web Worker lifecycle management
// Decision D-030: client-only, zero server image transmission
// The hook spawns the worker lazily, sends images for processing,
// and surfaces typed progress/result/error state to the UI.

import * as React from "react";
import type { OCRWorkerInMessage, OCRWorkerOutMessage } from "./ocr.worker";

// ============================================================================
// Types
// ============================================================================

export interface OCRState {
  status: "idle" | "loading_engine" | "initializing" | "recognizing" | "extracting_text" | "done" | "error" | "unavailable";
  progress: number; // 0..1
  lines: string[];  // extracted text lines
  rawText: string;
  error: string | null;
}

export interface UseOCRResult {
  state: OCRState;
  processImage: (imageData: ImageData) => void;
  reset: () => void;
  isAvailable: boolean;
}

const INITIAL_STATE: OCRState = {
  status: "idle",
  progress: 0,
  lines: [],
  rawText: "",
  error: null,
};

// ============================================================================
// Hook
// ============================================================================

/**
 * Manages a dedicated OCR Web Worker instance.
 * Worker is created lazily on first processImage() call.
 * Gracefully falls back to "unavailable" if Workers are not supported
 * (e.g., SSR or restricted browser environments).
 * UI remains fully functional when OCR is unavailable — manual selection still works.
 */
export function useOCR(): UseOCRResult {
  const [state, setState] = React.useState<OCRState>(INITIAL_STATE);
  const [isAvailable, setIsAvailable] = React.useState(true);

  const workerRef = React.useRef<Worker | null>(null);
  const jobIdRef = React.useRef(0);

  // Check worker availability on mount
  React.useEffect(() => {
    if (typeof Worker === "undefined") {
      setIsAvailable(false);
      setState((s) => ({ ...s, status: "unavailable" }));
    }
  }, []);

  // Cleanup worker on unmount
  React.useEffect(() => {
    return () => {
      if (workerRef.current) {
        const terminateMsg: OCRWorkerInMessage = { type: "TERMINATE" };
        workerRef.current.postMessage(terminateMsg);
        workerRef.current = null;
      }
    };
  }, []);

  const getOrCreateWorker = React.useCallback((): Worker | null => {
    if (typeof Worker === "undefined") return null;

    if (!workerRef.current) {
      try {
        // Vite handles ?worker suffix for Web Workers
        // We use dynamic URL construction to keep the import resolvable
        workerRef.current = new Worker(
          new URL("./ocr.worker.ts", import.meta.url),
          { type: "module" }
        );

        workerRef.current.onmessage = (event: MessageEvent<OCRWorkerOutMessage>) => {
          const msg = event.data;

          if (msg.type === "READY") {
            return; // Worker initialized, no state change needed
          }

          if (msg.type === "PROGRESS") {
            setState((s) => ({
              ...s,
              status: msg.status as OCRState["status"],
              progress: msg.progress,
            }));
          } else if (msg.type === "RESULT") {
            setState((s) => ({
              ...s,
              status: "done",
              progress: 1,
              lines: msg.lines,
              rawText: msg.rawText,
              error: null,
            }));
          } else if (msg.type === "ERROR") {
            setState((s) => ({
              ...s,
              status: "error",
              error: msg.message,
            }));
          }
        };

        workerRef.current.onerror = (err) => {
          setState((s) => ({
            ...s,
            status: "error",
            error: `OCR worker crashed: ${err.message}`,
          }));
        };
      } catch {
        setIsAvailable(false);
        setState((s) => ({ ...s, status: "unavailable" }));
        return null;
      }
    }

    return workerRef.current;
  }, []);

  const processImage = React.useCallback(
    (imageData: ImageData) => {
      const worker = getOrCreateWorker();
      if (!worker) return;

      const jobId = String(++jobIdRef.current);

      setState({
        status: "loading_engine",
        progress: 0.05,
        lines: [],
        rawText: "",
        error: null,
      });

      const msg: OCRWorkerInMessage = { type: "PROCESS", imageData, jobId };
      worker.postMessage(msg, [imageData.data.buffer]);
    },
    [getOrCreateWorker]
  );

  const reset = React.useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return { state, processImage, reset, isAvailable };
}

// ============================================================================
// Utility: extract ImageData from File or clipboard item
// (main-thread helper — runs synchronously before dispatch to worker)
// ============================================================================

/**
 * Reads a File (image) into an ImageData suitable for the OCR worker.
 * Uses an OffscreenCanvas where available, HTMLCanvasElement otherwise.
 * Returns null if the file is not a valid image.
 *
 * NOTE: Only image data processing. No data is sent to any server.
 */
export async function fileToImageData(file: File): Promise<ImageData | null> {
  if (!file.type.startsWith("image/")) return null;

  return new Promise<ImageData | null>((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      resolve(imageData);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}

/**
 * Extract a preview data URL from a File for display (thumbnail).
 * Does NOT send data anywhere — stays in-browser.
 */
export function fileToPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}
