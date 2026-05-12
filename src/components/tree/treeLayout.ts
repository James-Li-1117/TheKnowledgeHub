import { hierarchy, tree } from "d3-hierarchy";

export type TreeInput = {
  id: string;
  title: string;
  children?: TreeInput[];
};

export type LaidOutNode = {
  id: string;
  title: string;
  x: number;
  y: number;
};

export type LaidOutEdge = { source: string; target: string };

/** Vertical tree centered in width */
export function layoutChapterTree(root: TreeInput, width: number) {
  const h = hierarchy(root, (d) => d.children ?? []);
  const layout = tree<TreeInput>().nodeSize([150, 78])(h);

  let minX = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  layout.each((d) => {
    minX = Math.min(minX, d.x);
    maxX = Math.max(maxX, d.x);
    maxY = Math.max(maxY, d.y);
  });
  const mid = (minX + maxX) / 2 || 0;

  const nodes: LaidOutNode[] = [];
  const edges: LaidOutEdge[] = [];

  layout.each((d) => {
    nodes.push({
      id: d.data.id,
      title: d.data.title,
      x: width / 2 + (d.x - mid),
      y: d.y + 48,
    });
  });

  layout.links().forEach((l) => {
    edges.push({
      source: (l.source as { data: TreeInput }).data.id,
      target: (l.target as { data: TreeInput }).data.id,
    });
  });

  const height = maxY + 140;
  return { nodes, edges, height };
}
