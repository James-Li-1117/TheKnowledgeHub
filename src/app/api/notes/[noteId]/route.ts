import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

const patchBody = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ noteId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { noteId } = await ctx.params;
  const json = await req.json().catch(() => ({}));
  const parsed = patchBody.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const existing = await prisma.note.findFirst({
    where: { id: noteId, authorId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: { title?: string; content?: string | null; tags?: string[] } = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title.trim();
  if (parsed.data.content !== undefined) data.content = parsed.data.content?.trim() || null;
  if (parsed.data.tags !== undefined) data.tags = parsed.data.tags;

  const note = await prisma.note.update({
    where: { id: noteId },
    data,
    include: {
      author: { select: { id: true, name: true, email: true } },
      course: { select: { code: true, title: true } },
      chapter: { select: { title: true, slug: true } },
    },
  });

  return NextResponse.json({ note });
}
