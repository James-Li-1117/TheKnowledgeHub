import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { createNoteWithUpload } from "@/lib/notes/createNote";
import { buildNotePreview } from "@/lib/notes/notePreview";

export async function POST(req: Request, ctx: { params: Promise<{ nodeId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { nodeId } = await ctx.params;
  const node = await prisma.mindMapNode.findFirst({
    where: { id: nodeId, authorId: session.user.id },
  });
  if (!node) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "multipart/form-data required" }, { status: 400 });
  }

  const form = await req.formData();
  const title = String(form.get("title") || "").trim();
  const content = String(form.get("content") || "").trim() || null;
  const tagsRaw = String(form.get("tags") || "").trim();
  const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];
  let fileBuffer: Buffer | null = null;
  let fileName: string | null = null;
  let mimeType: string | null = null;
  const file = form.get("file");
  if (file instanceof File && file.size > 0) {
    fileName = file.name;
    mimeType = file.type || "application/octet-stream";
    fileBuffer = Buffer.from(await file.arrayBuffer());
  }

  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const created = await createNoteWithUpload({
    authorId: session.user.id,
    courseId: node.courseId,
    chapterId: null,
    title,
    content,
    tags,
    file:
      fileBuffer && fileName
        ? { buffer: fileBuffer, fileName, mimeType: mimeType || "application/octet-stream", size: fileBuffer.length }
        : null,
  });

  if (!created.ok) {
    return NextResponse.json({ error: created.error }, { status: created.status });
  }

  const { note, uploadSummary } = created.data;

  const preview = await buildNotePreview({
    userId: session.user.id,
    title: note.title,
    content: note.content,
    fileBuffer,
    fileName,
    mimeType,
  });

  const updated = await prisma.mindMapNode.update({
    where: { id: nodeId },
    data: {
      linkedNoteId: note.id,
      previewImageUrl: preview.previewImageUrl,
      previewText: preview.previewText,
    },
    select: {
      id: true,
      title: true,
      x: true,
      y: true,
      isRoot: true,
      parentId: true,
      linkedNoteId: true,
      previewImageUrl: true,
      previewText: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ node: updated, note, uploadSummary });
}
