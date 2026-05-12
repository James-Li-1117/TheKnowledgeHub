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
 * Image: thumbnail via sharp + Supabase when configured.
 * PDF: first-page rasterization needs native canvas (optional); we use text extract + snippet as sticker text.
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
    const pdfText = await pdfTextFallback(fileBuffer);
    return {
      previewImageUrl: null,
      previewText: pdfText ? `📄 ${title}\n${pdfText}`.slice(0, 520) : textSnippet(title, content),
    };
  }

  return { previewImageUrl: null, previewText: textSnippet(title, content) };
}
