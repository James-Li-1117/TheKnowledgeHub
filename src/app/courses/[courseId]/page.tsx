import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getCourseTheme } from "@/lib/courseThemes";
import { ensureMindMapRoot } from "@/lib/mindmap/ensureRoot";
import { CoursePageClient } from "./CoursePageClient";

export default async function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { courseId } = await params;
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) notFound();

  await ensureMindMapRoot(course.id, session.user.id);

  const mindRows = await prisma.mindMapNode.findMany({
    where: { courseId: course.id, authorId: session.user.id },
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
    },
  });

  const mindMapNodes = mindRows.map((n) => ({
    ...n,
    previewImageUrl: n.previewImageUrl,
    previewText: n.previewText,
  }));

  const theme = getCourseTheme(course.themeKey);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/courses" className="text-sm font-medium text-emerald-600 hover:underline">
          ← 返回课程列表
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{course.title}</h1>
        <p className="text-sm text-slate-600">
          {course.code} · 主题：{theme.label}
        </p>
      </div>

      <CoursePageClient
        course={{
          id: course.id,
          code: course.code,
          title: course.title,
          themeKey: course.themeKey,
          accentColor: course.accentColor,
        }}
        mindMapNodes={mindMapNodes}
      />

      <div className="flex gap-3">
        <Link
          href={`/notes/new?courseId=${course.id}`}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-600"
        >
          上传笔记（表单）
        </Link>
      </div>
    </div>
  );
}
