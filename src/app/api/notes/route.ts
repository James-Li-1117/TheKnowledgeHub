import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { createNoteWithUpload } from "@/lib/notes/createNote";

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
  let filePart: { buffer: Buffer; fileName: string; mimeType: string; size: number } | null = null;

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
      if (file.size > 12 * 1024 * 1024) {
        return NextResponse.json({ error: "File too large (max 12MB)" }, { status: 400 });
      }
      const buf = Buffer.from(await file.arrayBuffer());
      filePart = {
        buffer: buf,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
      };
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

  const result = await createNoteWithUpload({
    authorId: session.user.id,
    courseId,
    chapterId,
    title,
    content,
    tags,
    file: filePart,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ note: result.data.note, uploadSummary: result.data.uploadSummary });
}
