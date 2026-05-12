import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

const patchBody = z.object({
  title: z.string().min(1).max(200).optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  parentId: z.string().nullable().optional(),
});

async function wouldCreateCycle(nodeId: string, newParentId: string | null): Promise<boolean> {
  if (!newParentId) return false;
  let cur: string | null = newParentId;
  const seen = new Set<string>();
  while (cur) {
    if (cur === nodeId) return true;
    if (seen.has(cur)) return true;
    seen.add(cur);
    const row: { parentId: string | null } | null = await prisma.mindMapNode.findUnique({
      where: { id: cur },
      select: { parentId: true },
    });
    cur = row?.parentId ?? null;
  }
  return false;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ nodeId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { nodeId } = await ctx.params;
  const node = await prisma.mindMapNode.findFirst({
    where: { id: nodeId, authorId: session.user.id },
  });
  if (!node) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const json = await req.json().catch(() => ({}));
  const parsed = patchBody.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  if (node.isRoot && parsed.data.parentId !== undefined && parsed.data.parentId !== null) {
    return NextResponse.json({ error: "Root cannot be reparented" }, { status: 400 });
  }

  const data: { title?: string; x?: number; y?: number; parentId?: string | null } = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title.trim();
  if (parsed.data.x !== undefined) data.x = parsed.data.x;
  if (parsed.data.y !== undefined) data.y = parsed.data.y;

  if (parsed.data.parentId !== undefined && !node.isRoot) {
    const newParentId = parsed.data.parentId;
    if (newParentId === null) {
      return NextResponse.json({ error: "Non-root nodes must have a parent" }, { status: 400 });
    }
    const parent = await prisma.mindMapNode.findFirst({
      where: { id: newParentId, courseId: node.courseId, authorId: session.user.id },
    });
    if (!parent) return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    if (await wouldCreateCycle(nodeId, newParentId)) {
      return NextResponse.json({ error: "Cycle not allowed" }, { status: 400 });
    }
    data.parentId = newParentId;
  }

  const updated = await prisma.mindMapNode.update({
    where: { id: nodeId },
    data,
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

  return NextResponse.json({ node: updated });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ nodeId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { nodeId } = await ctx.params;
  const node = await prisma.mindMapNode.findFirst({
    where: { id: nodeId, authorId: session.user.id },
  });
  if (!node) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (node.isRoot) return NextResponse.json({ error: "Cannot delete root" }, { status: 400 });

  await prisma.mindMapNode.delete({ where: { id: nodeId } });
  return NextResponse.json({ ok: true });
}
