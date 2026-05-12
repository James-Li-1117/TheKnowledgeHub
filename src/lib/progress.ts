import prisma from "@/lib/prisma";

/** Mastery 0..1 from completion flag + note count (same formula as recomputeChapterMastery). */
export function computeChapterMasteryValue(completed: boolean | undefined, noteCount: number): number {
  const base = completed ? 0.55 : 0.15;
  const bump = Math.min(0.45, noteCount * 0.12);
  return Math.min(1, base + bump);
}

/** Mastery 0..1 from notes + completion */
export async function recomputeChapterMastery(userId: string, chapterId: string) {
  const progress = await prisma.chapterProgress.findUnique({
    where: { userId_chapterId: { userId, chapterId } },
  });
  const noteCount = await prisma.note.count({ where: { authorId: userId, chapterId } });

  const mastery = computeChapterMasteryValue(progress?.completed, noteCount);

  await prisma.chapterProgress.upsert({
    where: { userId_chapterId: { userId, chapterId } },
    create: { userId, chapterId, completed: progress?.completed ?? false, mastery },
    update: { mastery },
  });

  return mastery;
}

export async function getUserCourseProgress(userId: string, courseId: string) {
  const chapters = await prisma.chapter.findMany({
    where: { courseId },
    select: { id: true, parentId: true, title: true, slug: true, order: true },
    orderBy: [{ order: "asc" }],
  });

  const progressRows = await prisma.chapterProgress.findMany({
    where: { userId, chapterId: { in: chapters.map((c) => c.id) } },
  });
  const noteCounts = await prisma.note.groupBy({
    by: ["chapterId"],
    where: { authorId: userId, courseId, chapterId: { not: null } },
    _count: { _all: true },
  });
  const noteMap = new Map(
    noteCounts.filter((n) => n.chapterId).map((n) => [n.chapterId!, n._count._all])
  );

  const progMap = new Map(progressRows.map((p) => [p.chapterId, p]));

  let completed = 0;
  let sumMastery = 0;
  for (const ch of chapters) {
    const p = progMap.get(ch.id);
    if (p?.completed) completed++;
    sumMastery += p?.mastery ?? 0;
  }

  const total = chapters.length || 1;
  return {
    chapterCount: chapters.length,
    completedChapters: completed,
    avgMastery: sumMastery / total,
    fraction: completed / total,
    chapters: chapters.map((ch) => {
      const p = progMap.get(ch.id);
      return {
        ...ch,
        completed: p?.completed ?? false,
        mastery: p?.mastery ?? 0,
        noteCount: noteMap.get(ch.id) ?? 0,
      };
    }),
  };
}

export async function snapshotProgress(userId: string, label?: string) {
  const courses = await prisma.course.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      chapters: { select: { id: true } },
    },
  });

  const allChapterIds = courses.flatMap((c) => c.chapters.map((ch) => ch.id));
  const prog = await prisma.chapterProgress.findMany({
    where: { userId, chapterId: { in: allChapterIds } },
  });
  const progByChapter = Object.fromEntries(prog.map((p) => [p.chapterId, p]));

  const data = {
    at: new Date().toISOString(),
    courses: courses.map((c) => ({
      code: c.code,
      completed: c.chapters.filter((ch) => progByChapter[ch.id]?.completed).length,
      total: c.chapters.length,
      masteryAvg:
        c.chapters.reduce((acc, ch) => acc + (progByChapter[ch.id]?.mastery ?? 0), 0) /
        (c.chapters.length || 1),
    })),
  };

  await prisma.progressSnapshot.create({
    data: { userId, label: label ?? "auto", data },
  });

  return data;
}
