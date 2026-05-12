import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { ensureMindMapRoot } from "@/lib/mindmap/ensureRoot";

async function ensureRootNode(courseId: string, authorId: string) {
  return ensureMindMapRoot(courseId, authorId);
}

export async function GET(_req: Request, ctx: { params: Promise<{ courseId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { courseId } = await ctx.params;
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  await ensureRootNode(courseId, session.user.id);

  const nodes = await prisma.mindMapNode.findMany({
    where: { courseId, authorId: session.user.id },
    orderBy: { createdAt: "asc" },
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

  return NextResponse.json({ nodes });
}

const postBody = z.object({
  title: z.string().min(1).max(200),
  parentId: z.string().min(1),
  x: z.number().optional(),
  y: z.number().optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ courseId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { courseId } = await ctx.params;
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const json = await req.json().catch(() => null);
  const parsed = postBody.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { title, parentId } = parsed.data;
  const parent = await prisma.mindMapNode.findFirst({
    where: { id: parentId, courseId, authorId: session.user.id },
  });
  if (!parent) return NextResponse.json({ error: "Parent node not found" }, { status: 404 });

  const siblingCount = await prisma.mindMapNode.count({
    where: { parentId, authorId: session.user.id, courseId },
  });

  const x = parsed.data.x ?? parent.x + 200;
  const y = parsed.data.y ?? parent.y + siblingCount * 72;

  const node = await prisma.mindMapNode.create({
    data: {
      courseId,
      authorId: session.user.id,
      title: title.trim(),
      parentId,
      x,
      y,
      isRoot: false,
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

  return NextResponse.json({ node });
}
