import prisma from "@/lib/prisma";

export async function ensureMindMapRoot(courseId: string, authorId: string) {
  const existing = await prisma.mindMapNode.findFirst({
    where: { courseId, authorId, isRoot: true },
  });
  if (existing) return existing;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return null;

  return prisma.mindMapNode.create({
    data: {
      courseId,
      authorId,
      title: course.title,
      x: 0,
      y: 0,
      isRoot: true,
      parentId: null,
    },
  });
}
