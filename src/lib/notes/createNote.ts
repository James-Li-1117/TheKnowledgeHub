import prisma from "@/lib/prisma";
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { computeChapterMasteryValue, recomputeChapterMastery } from "@/lib/progress";
import { evaluateAchievements } from "@/lib/achievements";

export type CreateNoteInput = {
  authorId: string;
  courseId: string;
  chapterId?: string | null;
  title: string;
  content?: string | null;
  tags?: string[];
  file?: { buffer: Buffer; fileName: string; mimeType: string; size: number } | null;
};

export type CreateNoteResult = {
  note: {
    id: string;
    authorId: string;
    courseId: string;
    chapterId: string | null;
    title: string;
    content: string | null;
    fileUrl: string | null;
    fileName: string | null;
    mimeType: string | null;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
  };
  uploadSummary: {
    noteId: string;
    chapterProgress: {
      beforeMastery: number;
      afterMastery: number;
      delta: number;
    } | null;
    newlyUnlockedAchievements: { key: string; title: string }[];
  };
};

const MAX_FILE_BYTES = 12 * 1024 * 1024;

export async function createNoteWithUpload(input: CreateNoteInput): Promise<
  | { ok: true; data: CreateNoteResult }
  | { ok: false; status: number; error: string }
> {
  const { authorId, courseId, title } = input;
  const chapterId = input.chapterId ?? null;
  const content = input.content?.trim() || null;
  const tags = input.tags ?? [];
  let fileUrl: string | null = null;
  let fileName: string | null = null;
  let mimeType: string | null = null;

  if (!title.trim() || !courseId) {
    return { ok: false, status: 400, error: "title and courseId required" };
  }

  const file = input.file;
  if (file) {
    if (file.size > MAX_FILE_BYTES) {
      return { ok: false, status: 400, error: "File too large (max 12MB)" };
    }
    fileName = file.fileName;
    mimeType = file.mimeType || "application/octet-stream";
    if (isSupabaseConfigured()) {
      const admin = createSupabaseAdmin();
      const bucket = process.env.SUPABASE_STORAGE_BUCKET || "notes";
      const path = `${authorId}/${Date.now()}_${file.fileName.replace(/[^\w.\-]+/g, "_")}`;
      const { error } = await admin!.storage.from(bucket).upload(path, file.buffer, {
        contentType: mimeType,
        upsert: false,
      });
      if (error) return { ok: false, status: 500, error: error.message };
      const { data: pub } = admin!.storage.from(bucket).getPublicUrl(path);
      fileUrl = pub.publicUrl;
    } else {
      fileUrl = `local:${file.fileName}`;
    }
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return { ok: false, status: 404, error: "Course not found" };

  if (chapterId) {
    const ch = await prisma.chapter.findFirst({ where: { id: chapterId, courseId } });
    if (!ch) return { ok: false, status: 404, error: "Chapter not found" };
  }

  let beforeMastery: number | null = null;
  if (chapterId) {
    const progressRow = await prisma.chapterProgress.findUnique({
      where: { userId_chapterId: { userId: authorId, chapterId } },
    });
    const noteCountBefore = await prisma.note.count({
      where: { authorId, chapterId },
    });
    beforeMastery = computeChapterMasteryValue(progressRow?.completed, noteCountBefore);
  }

  const note = await prisma.note.create({
    data: {
      authorId,
      courseId,
      chapterId,
      title: title.trim(),
      content,
      tags,
      fileUrl,
      fileName,
      mimeType,
    },
  });

  let afterMastery: number | null = null;
  if (chapterId) {
    afterMastery = await recomputeChapterMastery(authorId, chapterId);
  }
  const { newlyUnlocked } = await evaluateAchievements(authorId);

  let newlyUnlockedAchievements: { key: string; title: string }[] = [];
  if (newlyUnlocked.length > 0) {
    const rows = await prisma.achievement.findMany({
      where: { key: { in: newlyUnlocked } },
      select: { key: true, title: true },
    });
    newlyUnlockedAchievements = rows.map((a) => ({ key: a.key, title: a.title }));
  }

  const uploadSummary = {
    noteId: note.id,
    chapterProgress:
      chapterId && beforeMastery !== null && afterMastery !== null
        ? {
            beforeMastery,
            afterMastery,
            delta: afterMastery - beforeMastery,
          }
        : null,
    newlyUnlockedAchievements,
  };

  return { ok: true, data: { note, uploadSummary } };
}
