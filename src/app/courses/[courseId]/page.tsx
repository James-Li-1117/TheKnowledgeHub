import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getUserCourseProgress } from "@/lib/progress";
import { getCourseTheme } from "@/lib/courseThemes";
import { CoursePageClient } from "./CoursePageClient";

export default async function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { courseId } = await params;
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) notFound();

  const detail = await getUserCourseProgress(session.user.id, course.id);
  const theme = getCourseTheme(course.themeKey);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/courses" className="text-sm text-emerald-400 hover:underline">
          ← 返回课程列表
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-white">{course.title}</h1>
        <p className="text-sm text-slate-400">
          主题：{theme.label} · 完成度 {Math.round(detail.fraction * 100)}%（{detail.completedChapters}/
          {detail.chapterCount} 章）
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
        chapters={detail.chapters}
      />

      <div className="flex gap-3">
        <Link
          href={`/notes/new?courseId=${course.id}`}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
        >
          为本课添加笔记
        </Link>
      </div>
    </div>
  );
}
