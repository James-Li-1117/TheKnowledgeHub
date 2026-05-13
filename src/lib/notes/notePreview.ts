import { createCanvas, type Canvas } from "@napi-rs/canvas";
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export type PreviewBuildInput = {
  userId: string;
  title: string;
  content: string | null;
  fileBuffer: Buffer | null;
  fileName: string | null;
  mimeType: string | null;
};

export type PreviewBuildResult = {
  previewImageUrl: string | null;
  previewText: string | null;
};

/** Matches pdf.js `CanvasFactory` contract (see pdfjs-dist `BaseCanvasFactory`). */
class NapiPdfCanvasFactory {
  constructor(_opts?: { ownerDocument?: unknown; enableHWA?: boolean }) {
    void _opts;
  }

  create(width: number, height: number): { canvas: Canvas; context: ReturnType<Canvas["getContext"]> } {
    const w = Math.ceil(width);
    const h = Math.ceil(height);
    if (w <= 0 || h <= 0) throw new Error("Invalid canvas size");
    const canvas = createCanvas(w, h);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Cannot get 2d context");
    return { canvas, context };
  }

  reset(
    canvasAndContext: { canvas: Canvas; context: ReturnType<Canvas["getContext"]> },
    width: number,
    height: number
  ) {
    if (!canvasAndContext.canvas) throw new Error("Canvas is not specified");
    if (width <= 0 || height <= 0) throw new Error("Invalid canvas size");
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }

  destroy(canvasAndContext: { canvas: Canvas | null; context: ReturnType<Canvas["getContext"]> | null }) {
    if (!canvasAndContext.canvas) throw new Error("Canvas is not specified");
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
}

function textSnippet(title: string, content: string | null, max = 220): string {
  const base = (content || "").replace(/\s+/g, " ").trim();
  const s = base ? `${title} — ${base}` : title;
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

async function uploadPreviewPng(userId: string, png: Buffer): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const admin = createSupabaseAdmin();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "notes";
  const path = `${userId}/previews/${Date.now()}_thumb.png`;
  const { error } = await admin!.storage.from(bucket).upload(path, png, {
    contentType: "image/png",
    upsert: false,
  });
  if (error) return null;
  const { data: pub } = admin!.storage.from(bucket).getPublicUrl(path);
  return pub.publicUrl;
}

async function sharpResizeToPng(buffer: Buffer, maxW = 280): Promise<Buffer | null> {
  try {
    const sharp = (await import("sharp")).default;
    return await sharp(buffer).resize({ width: maxW, withoutEnlargement: true }).png({ quality: 85 }).toBuffer();
  } catch {
    return null;
  }
}

async function pdfTextFallback(buffer: Buffer): Promise<string | null> {
  try {
    const mod = (await import("pdf-parse")) as unknown as {
      default: (b: Buffer) => Promise<{ text?: string }>;
    };
    const data = await mod.default(buffer);
    const t = (data.text || "").replace(/\s+/g, " ").trim();
    return t ? t.slice(0, 400) : null;
  } catch {
    return null;
  }
}

/**
 * Rasterize first PDF page to PNG using pdf.js + @napi-rs/canvas (server-side).
 */
async function pdfFirstPageToPngBuffer(pdfBuffer: Buffer): Promise<Buffer | null> {
  try {
    const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const loadingTask = getDocument({
      data: new Uint8Array(pdfBuffer),
      CanvasFactory: NapiPdfCanvasFactory,
    });
    const pdf = await loadingTask.promise;
    if (pdf.numPages < 1) return null;
    const page = await pdf.getPage(1);
    const scale = 1.35;
    const viewport = page.getViewport({ scale });
    const width = Math.ceil(viewport.width);
    const height = Math.ceil(viewport.height);
    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");
    if (!context) return null;

    const renderTask = page.render({
      canvasContext: context as unknown as CanvasRenderingContext2D,
      viewport,
    });
    await renderTask.promise;

    const png = await canvas.encode("png");
    return Buffer.from(png);
  } catch {
    return null;
  }
}

/**
 * Image: thumbnail via sharp + Supabase when configured.
 * PDF: first page rasterized via pdf.js + @napi-rs/canvas when possible; else text extract snippet.
 */
export async function buildNotePreview(input: PreviewBuildInput): Promise<PreviewBuildResult> {
  const { userId, title, content, fileBuffer, mimeType } = input;
  if (!fileBuffer || !mimeType) {
    return { previewImageUrl: null, previewText: textSnippet(title, content) };
  }

  const mime = mimeType.toLowerCase();

  if (mime.startsWith("image/")) {
    const png = await sharpResizeToPng(fileBuffer);
    if (png) {
      const url = await uploadPreviewPng(userId, png);
      if (url) return { previewImageUrl: url, previewText: title };
    }
    return { previewImageUrl: null, previewText: textSnippet(title, content) };
  }

  if (mime === "application/pdf" || mime.endsWith("/pdf")) {
    const rawPng = await pdfFirstPageToPngBuffer(fileBuffer);
    if (rawPng) {
      const thumb = (await sharpResizeToPng(rawPng)) ?? rawPng;
      const url = await uploadPreviewPng(userId, thumb);
      if (url) {
        return { previewImageUrl: url, previewText: title };
      }
    }
    const pdfText = await pdfTextFallback(fileBuffer);
    return {
      previewImageUrl: null,
      previewText: pdfText ? `📄 ${title}\n${pdfText}`.slice(0, 520) : textSnippet(title, content),
    };
  }

  return { previewImageUrl: null, previewText: textSnippet(title, content) };
}
