"use client";

import { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  type Edge,
  type Node,
  type NodeProps,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

export type GlobalCourseStat = {
  id: string;
  code: string;
  title: string;
  themeKey: string;
  accentColor: string;
  fraction: number;
};

function polar(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

export function GlobalKnowledgeTree({ courses }: { courses: GlobalCourseStat[] }) {
  const { nodes, edges } = useMemo(() => buildGlobalGraph(courses), [courses]);

  const nodeTypes = useMemo(
    () => ({
      trunk: TrunkNode,
      course: CourseTrunkNode,
    }),
    []
  );

  return (
    <div className="h-[520px] w-full overflow-hidden rounded-3xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50 via-white to-sky-50 shadow-inner">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.45}
        maxZoom={1.25}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={22} color="#86efac66" />
        <Controls />
      </ReactFlow>
    </div>
  );
}

function buildGlobalGraph(courses: GlobalCourseStat[]) {
  const cx = 420;
  const cy = 300;
  const r = 220;
  const rootId = "root-math-physics";

  const nodes: Node[] = [
    {
      id: rootId,
      position: { x: cx - 110, y: cy - 190 },
      data: { label: "数学 · 物理 知识树" },
      type: "trunk",
    },
  ];

  const edges: Edge[] = [];
  const n = Math.max(courses.length, 1);
  courses.forEach((c, i) => {
    const angle = (-Math.PI / 2 + (i / n) * Math.PI * 2) * 0.92;
    const p = polar(cx, cy, r, angle);
    const growth = 0.35 + c.fraction * 0.95;
    nodes.push({
      id: c.id,
      position: { x: p.x - 72, y: p.y - 36 },
      data: {
        label: c.code,
        subtitle: c.title,
        accent: c.accentColor,
        themeKey: c.themeKey,
        fraction: c.fraction,
        growth,
      },
      type: "course",
    });
    edges.push({
      id: `${rootId}-${c.id}`,
      source: rootId,
      target: c.id,
      style: { stroke: `${c.accentColor}99`, strokeWidth: 2 + c.fraction * 3 },
      animated: c.fraction > 0.2,
      markerEnd: { type: MarkerType.ArrowClosed, color: c.accentColor },
    });
  });

  return { nodes, edges };
}

function TrunkNode({ data }: NodeProps) {
  const d = data as { label: string };
  return (
    <div className="tree-pulse w-[220px] rounded-2xl border-2 border-emerald-300 bg-white/95 px-4 py-3 text-center text-slate-800 shadow-lg shadow-emerald-100">
      <div className="text-sm font-semibold tracking-wide text-emerald-700">{d.label}</div>
      <div className="mt-1 text-[11px] text-slate-500">可爱枝干 · 一起长大</div>
    </div>
  );
}

function CourseTrunkNode({ data }: NodeProps) {
  const d = data as {
    label: string;
    subtitle: string;
    accent: string;
    themeKey: string;
    fraction: number;
    growth: number;
  };
  const scale = 0.85 + d.growth * 0.2;
  return (
    <div
      className="w-[150px] rounded-2xl border-2 bg-white/95 px-3 py-2 text-[11px] text-slate-800 shadow-md backdrop-blur-sm transition-transform"
      style={{
        transform: `scale(${scale})`,
        borderColor: d.accent,
        boxShadow: `0 8px 22px color-mix(in oklab, ${d.accent} 22%, transparent)`,
      }}
    >
      <div className="text-xs font-bold" style={{ color: d.accent }}>
        {d.label}
      </div>
      <div className="mt-1 line-clamp-2 text-[10px] leading-snug text-slate-600">{d.subtitle}</div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.round(d.fraction * 100)}%`,
            background: `linear-gradient(90deg, ${d.accent}, #bbf7d0)`,
          }}
        />
      </div>
    </div>
  );
}
