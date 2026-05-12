import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { NewNoteForm } from "./NewNoteForm";

export default async function NewNotePage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string; chapterId?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const sp = await searchParams;
  const courses = await prisma.course.findMany({
    orderBy: { sortOrder: "asc" },
    include: { chapters: { orderBy: { order: "asc" }, select: { id: true, title: true, parentId: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">上传笔记</h1>
      <NewNoteForm courses={courses} initialCourseId={sp.courseId} initialChapterId={sp.chapterId} />
    </div>
  );
}
