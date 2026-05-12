import type { TreeInput } from "@/components/tree/treeLayout";

export type FlatChapter = {
  id: string;
  title: string;
  parentId: string | null;
  order: number;
};

/** Build a single-root tree for visualization */
export function flatChaptersToTree(chapters: FlatChapter[]): TreeInput {
  const sorted = [...chapters].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  const byParent = new Map<string | null, FlatChapter[]>();
  for (const c of sorted) {
    const k = c.parentId;
    if (!byParent.has(k)) byParent.set(k, []);
    byParent.get(k)!.push(c);
  }
  for (const arr of byParent.values()) arr.sort((a, b) => a.order - b.order);

  function walk(parentId: string | null): TreeInput[] {
    return (byParent.get(parentId) ?? []).map((ch) => {
      const kids = walk(ch.id);
      return {
        id: ch.id,
        title: ch.title,
        children: kids.length ? kids : undefined,
      };
    });
  }

  const roots = byParent.get(null) ?? [];
  if (roots.length === 1) {
    const r = roots[0];
    const kids = walk(r.id);
    return { id: r.id, title: r.title, children: kids.length ? kids : undefined };
  }

  return {
    id: "__virtual_root__",
    title: "课程大纲",
    children: walk(null),
  };
}
