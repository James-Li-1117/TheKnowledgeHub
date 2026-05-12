import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { recomputeChapterMastery } from "@/lib/progress";
import { evaluateAchievements } from "@/lib/achievements";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notes = await prisma.note.findMany({
    where: { authorId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { course: { select: { code: true, title: true } }, chapter: { select: { title: true, slug: true } } },
    take: 100,
  });
  return NextResponse.json({ notes });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = req.headers.get("content-type") || "";
  let title: string;
  let courseId: string;
  let chapterId: string | null = null;
  let content: string | null = null;
  let tags: string[] = [];
  let fileUrl: string | null = null;
  let fileName: string | null = null;
  let mimeType: string | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    title = String(form.get("title") || "").trim();
    courseId = String(form.get("courseId") || "").trim();
    const ch = form.get("chapterId");
    chapterId = ch && String(ch) !== "" ? String(ch) : null;
    content = String(form.get("content") || "").trim() || null;
    const tagsRaw = String(form.get("tags") || "").trim();
    tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];
    const file = form.get("file");
    if (file instanceof File && file.size > 0) {
      fileName = file.name;
      mimeType = file.type || "application/octet-stream";
      const buf = Buffer.from(await file.arrayBuffer());
      if (file.size > 12 * 1024 * 1024) {
        return NextResponse.json({ error: "File too large (max 12MB)" }, { status: 400 });
      }
      if (isSupabaseConfigured()) {
        const admin = createSupabaseAdmin();
        const bucket = process.env.SUPABASE_STORAGE_BUCKET || "notes";
        const path = `${session.user.id}/${Date.now()}_${file.name.replace(/[^\w.\-]+/g, "_")}`;
        const { error } = await admin!.storage.from(bucket).upload(path, buf, {
          contentType: mimeType,
          upsert: false,
        });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        const { data: pub } = admin!.storage.from(bucket).getPublicUrl(path);
        fileUrl = pub.publicUrl;
      } else {
        fileUrl = `local:${fileName}`;
      }
    }
  } else {
    const json = await req.json();
    const parsed = z
      .object({
        title: z.string().min(1),
        courseId: z.string().min(1),
        chapterId: z.string().nullable().optional(),
        content: z.string().nullable().optional(),
        tags: z.array(z.string()).optional(),
      })
      .safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    title = parsed.data.title;
    courseId = parsed.data.courseId;
    chapterId = parsed.data.chapterId ?? null;
    content = parsed.data.content ?? null;
    tags = parsed.data.tags ?? [];
  }

  if (!title || !courseId) {
    return NextResponse.json({ error: "title and courseId required" }, { status: 400 });
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  if (chapterId) {
    const ch = await prisma.chapter.findFirst({ where: { id: chapterId, courseId } });
    if (!ch) return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  const note = await prisma.note.create({
    data: {
      authorId: session.user.id,
      courseId,
      chapterId,
      title,
      content,
      tags,
      fileUrl,
      fileName,
      mimeType,
    },
  });

  if (chapterId) {
    await recomputeChapterMastery(session.user.id, chapterId);
  }
  await evaluateAchievements(session.user.id);

  return NextResponse.json({ note });
}
