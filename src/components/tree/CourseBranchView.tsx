"use client";

import { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
  type NodeProps,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { layoutChapterTree, type TreeInput } from "./treeLayout";
import { getCourseTheme } from "@/lib/courseThemes";

type Props = {
  themeKey: string;
  accentColor: string;
  tree: TreeInput;
  completedMap: Record<string, boolean>;
  masteryMap: Record<string, number>;
};

export function CourseBranchView({ themeKey, accentColor, tree, completedMap, masteryMap }: Props) {
  const theme = getCourseTheme(themeKey);
  const width = 920;

  const { nodes: laid, edges: laidEdges, height } = useMemo(
    () => layoutChapterTree(tree, width),
    [tree, width]
  );

  const rfNodes: Node[] = useMemo(
    () =>
      laid.map((n) => {
        const done = completedMap[n.id] ?? false;
        const mastery = masteryMap[n.id] ?? 0;
        return {
          id: n.id,
          position: { x: n.x - 80, y: n.y - 28 },
          data: {
            label: n.title,
            done,
            mastery,
            accentColor,
            leafShape: theme.leafShape,
          },
          type: "chapter",
        };
      }),
    [laid, completedMap, masteryMap, accentColor, theme.leafShape]
  );

  const rfEdges: Edge[] = useMemo(
    () =>
      laidEdges.map((e, i) => ({
        id: `e-${i}`,
        source: e.source,
        target: e.target,
        animated: completedMap[e.target] ?? false,
        style: { stroke: `${accentColor}99`, strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: accentColor },
      })),
    [laidEdges, completedMap, accentColor]
  );

  const nodeTypes = useMemo(
    () => ({
      chapter: ChapterNode,
    }),
    []
  );

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br shadow-sm ${theme.bgGradient}`}
    >
      {theme.particle !== "none" && <Particles kind={theme.particle} color={accentColor} />}
      <div style={{ width: "100%", height }} className="min-h-[420px]">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.35}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} color="#cbd5e155" />
          <MiniMap maskColor="rgb(241,245,249)" className="rounded-lg border border-slate-200" />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}

function ChapterNode({ data }: NodeProps) {
  const d = data as {
    label: string;
    done: boolean;
    mastery: number;
    accentColor: string;
    leafShape: string;
  };
  const radius = d.leafShape === "hex" ? 6 : d.leafShape === "diamond" ? 4 : 14;
  return (
    <div
      className="w-[168px] border-2 bg-white/95 px-3 py-2 text-xs text-slate-800 shadow-md backdrop-blur-sm"
      style={{
        borderColor: d.done ? d.accentColor : "rgba(148,163,184,0.55)",
        borderRadius: radius,
        boxShadow: d.done ? `0 6px 18px color-mix(in oklab, ${d.accentColor} 28%, transparent)` : undefined,
      }}
    >
      <div className="font-medium leading-snug">{d.label}</div>
      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
        <span>{d.done ? "已完成" : "进行中"}</span>
        <span>{Math.round(d.mastery * 100)}%</span>
      </div>
    </div>
  );
}

function Particles({ kind, color }: { kind: string; color: string }) {
  const items = Array.from({ length: 14 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-40">
      {items.map((_, i) => (
        <span
          key={i}
          className="particle absolute rounded-full"
          style={{
            left: `${(i * 7) % 100}%`,
            top: `${(i * 13) % 100}%`,
            width: kind === "rings" ? 22 : 6,
            height: kind === "rings" ? 22 : 6,
            border: kind === "rings" ? `1px solid ${color}` : "none",
            background: kind === "rings" ? "transparent" : color,
            animationDelay: `${i * 0.25}s`,
          }}
        />
      ))}
    </div>
  );
}
