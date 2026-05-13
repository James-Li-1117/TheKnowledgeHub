"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  type Edge,
  type Node,
  type NodeProps,
  useEdgesState,
  useNodesState,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { getCourseTheme } from "@/lib/courseThemes";

export type MindMapNodeDTO = {
  id: string;
  title: string;
  x: number;
  y: number;
  isRoot: boolean;
  parentId: string | null;
  linkedNoteId: string | null;
  previewImageUrl: string | null;
  previewText: string | null;
};

type Props = {
  courseId: string;
  themeKey: string;
  accentColor: string;
  initialNodes: MindMapNodeDTO[];
};

function depthOf(id: string, byId: Map<string, MindMapNodeDTO>): number {
  let d = 0;
  let cur: string | undefined = id;
  const seen = new Set<string>();
  while (cur) {
    if (seen.has(cur)) break;
    seen.add(cur);
    const n = byId.get(cur);
    if (!n?.parentId) break;
    d += 1;
    cur = n.parentId;
  }
  return d;
}

function MindMapNodeCard({ data, selected }: NodeProps) {
  const router = useRouter();
  const d = data as {
    nodeId: string;
    title: string;
    accentColor: string;
    isRoot: boolean;
    depth: number;
    previewImageUrl: string | null;
    previewText: string | null;
    linkedNoteId: string | null;
    onAddChild: (parentId: string) => void;
  };
  const thick = d.isRoot ? 3 : Math.max(1.5, 2.4 - d.depth * 0.35);
  const hasNote = Boolean(d.linkedNoteId);
  const hasPreview = Boolean(d.previewImageUrl || d.previewText);

  function openNote(e: React.MouseEvent) {
    e.stopPropagation();
    if (d.linkedNoteId) router.push(`/notes/${d.linkedNoteId}`);
  }

  function stickyShell(clickable: boolean, children: ReactNode) {
    const inner = (
      <div className="relative rotate-[-0.8deg] rounded-sm bg-gradient-to-br from-[#fffef6] via-[#fff8dc] to-[#ffefc4] px-1.5 pb-1 pt-2 shadow-[2px_3px_8px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.65)] ring-1 ring-amber-200/80 transition group-hover:-translate-y-0.5 group-hover:shadow-[3px_5px_12px_rgba(15,23,42,0.14)]">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-2.5 w-9 -translate-x-1/2 -translate-y-px rounded-sm bg-white/75 shadow-sm ring-1 ring-white/90"
          aria-hidden
        />
        {children}
      </div>
    );
    if (clickable) {
      return (
        <button
          type="button"
          onClick={openNote}
          title="点击查看完整笔记与附件"
          className="group mt-2 w-full cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-1"
        >
          {inner}
          <p className="mt-1 text-center text-[8px] font-semibold uppercase tracking-wide text-emerald-700/90">
            点击查看
          </p>
        </button>
      );
    }
    return <div className="group mt-2 w-full">{inner}</div>;
  }

  let noteBlock: ReactNode;
  if (hasNote) {
    noteBlock = stickyShell(true, (
      <>
        {d.previewImageUrl ? (
          <div className="mt-1 overflow-hidden rounded border border-amber-100/90 bg-white/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={d.previewImageUrl} alt="" className="h-[72px] w-full object-cover object-top" />
          </div>
        ) : d.previewText ? (
          <p className="mt-1 line-clamp-4 whitespace-pre-wrap px-0.5 text-[9px] leading-snug text-amber-950/85">
            {d.previewText}
          </p>
        ) : (
          <p className="mt-1 px-0.5 text-[9px] font-medium text-emerald-800">已绑定笔记</p>
        )}
      </>
    ));
  } else if (hasPreview) {
    noteBlock = stickyShell(false, (
      <>
        {d.previewImageUrl ? (
          <div className="mt-1 overflow-hidden rounded border border-amber-100/90 bg-white/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={d.previewImageUrl} alt="" className="h-[72px] w-full object-cover object-top" />
          </div>
        ) : (
          <p className="mt-1 line-clamp-4 whitespace-pre-wrap px-0.5 text-[9px] leading-snug text-amber-950/85">
            {d.previewText}
          </p>
        )}
        <p className="mt-1 text-center text-[8px] text-slate-500">在右侧上传以绑定到节点</p>
      </>
    ));
  } else {
    noteBlock = <p className="mt-2 text-[10px] text-slate-400">在右侧上传笔记</p>;
  }

  return (
    <div
      className={`relative w-[200px] select-none rounded-2xl border bg-white/95 px-3 pb-2 pt-2 shadow-md ${
        selected ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-transparent" : ""
      }`}
      style={{
        borderColor: d.accentColor,
        borderWidth: thick,
        boxShadow: `0 4px 14px rgba(15, 23, 42, 0.08)`,
      }}
    >
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-slate-400" />
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-slate-400" />

      <div className="min-w-0">
        <p className="text-[11px] font-semibold leading-snug text-slate-800">{d.title}</p>
        {noteBlock}
      </div>

      <button
        type="button"
        className="mt-2 w-full rounded-lg border border-dashed border-slate-300 bg-slate-50/80 py-1 text-[11px] font-medium text-slate-600 hover:bg-white"
        onClick={(e) => {
          e.stopPropagation();
          d.onAddChild(d.nodeId);
        }}
      >
        + 子节点
      </button>
    </div>
  );
}

export function CourseMindMapView({ courseId, themeKey, accentColor, initialNodes }: Props) {
  const theme = getCourseTheme(themeKey);

  const [remoteNodes, setRemoteNodes] = useState<MindMapNodeDTO[]>(initialNodes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const byId = useMemo(() => new Map(remoteNodes.map((n) => [n.id, n])), [remoteNodes]);

  const addChild = useCallback(
    async (parentId: string) => {
      const title = window.prompt("新节点标题", "新想法");
      if (!title?.trim()) return;
      setBusy(true);
      setErr(null);
      try {
        const res = await fetch(`/api/courses/${courseId}/mindmap/nodes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title.trim(), parentId }),
        });
        const data = (await res.json().catch(() => ({}))) as { node?: MindMapNodeDTO; error?: string };
        if (!res.ok) {
          setErr(data.error || "创建失败");
          return;
        }
        if (data.node) setRemoteNodes((prev) => [...prev, data.node!]);
      } finally {
        setBusy(false);
      }
    },
    [courseId]
  );

  const rfNodes: Node[] = useMemo(
    () =>
      remoteNodes.map((n) => ({
        id: n.id,
        position: { x: n.x, y: n.y },
        data: {
          nodeId: n.id,
          title: n.title,
          accentColor,
          isRoot: n.isRoot,
          depth: depthOf(n.id, byId),
          previewImageUrl: n.previewImageUrl,
          previewText: n.previewText,
          linkedNoteId: n.linkedNoteId,
          onAddChild: addChild,
        },
        type: "mind",
        draggable: true,
        selected: selectedId === n.id,
      })),
    [remoteNodes, accentColor, selectedId, addChild, byId]
  );

  const rfEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    let i = 0;
    const map = new Map(remoteNodes.map((x) => [x.id, x]));
    for (const n of remoteNodes) {
      if (!n.parentId) continue;
      const dep = depthOf(n.id, map);
      const w = Math.max(1.5, 3.2 - dep * 0.45);
      edges.push({
        id: `e-${i++}`,
        source: n.parentId,
        target: n.id,
        type: "smoothstep",
        style: { stroke: accentColor, strokeWidth: w, opacity: 0.55 },
        markerEnd: { type: MarkerType.ArrowClosed, color: accentColor, width: 18, height: 18 },
      });
    }
    return edges;
  }, [remoteNodes, accentColor]);

  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges);

  useEffect(() => {
    setNodes(rfNodes);
  }, [rfNodes, setNodes]);

  useEffect(() => {
    setEdges(rfEdges);
  }, [rfEdges, setEdges]);

  const onNodeDragStop = useCallback(
    async (_e: React.MouseEvent, node: Node) => {
      await fetch(`/api/mindmap/nodes/${node.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ x: node.position.x, y: node.position.y }),
      });
      setRemoteNodes((prev) =>
        prev.map((n) => (n.id === node.id ? { ...n, x: node.position.x, y: node.position.y } : n))
      );
    },
    []
  );

  const nodeTypes = useMemo(
    () => ({
      mind: MindMapNodeCard,
    }),
    []
  );

  const selected = selectedId ? remoteNodes.find((n) => n.id === selectedId) : null;

  return (
    <div className="space-y-3">
      <div
        className={`relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br shadow-inner ${theme.bgGradient}`}
      >
        <div className="h-[520px] w-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStop={onNodeDragStop}
            onNodeClick={(_, n) => setSelectedId(n.id)}
            onPaneClick={() => setSelectedId(null)}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            minZoom={0.35}
            maxZoom={1.6}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={22} color="#94a3b833" />
            <Controls />
          </ReactFlow>
        </div>
      </div>

      {err ? <p className="text-sm text-rose-600">{err}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <p className="text-sm text-slate-600">
          拖拽节点调整位置；点击节点后在右侧上传笔记。PDF 首页缩略图 / 图片预览需配置 Supabase Storage；未配置时便签显示文字摘要。已绑定笔记时点击便签可打开笔记详情页查看附件。
          {busy ? <span className="ml-2 text-amber-600">处理中…</span> : null}
        </p>

        <aside className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          {!selected ? (
            <p className="text-sm text-slate-500">点击画布上的节点，在这里上传笔记。</p>
          ) : (
            <AttachNotePanel
              key={selected.id}
              node={selected}
              disabled={busy}
              onDone={(updated) => {
                setRemoteNodes((prev) => prev.map((n) => (n.id === updated.id ? { ...n, ...updated } : n)));
                setBusy(false);
              }}
              onBusy={setBusy}
              onError={setErr}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

function AttachNotePanel({
  node,
  disabled,
  onDone,
  onBusy,
  onError,
}: {
  node: MindMapNodeDTO;
  disabled: boolean;
  onDone: (n: MindMapNodeDTO) => void;
  onBusy: (b: boolean) => void;
  onError: (e: string | null) => void;
}) {
  const [title, setTitle] = useState("我的笔记");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    onError(null);
    if (!title.trim()) {
      onError("请填写标题");
      return;
    }
    onBusy(true);
    try {
      const fd = new FormData();
      fd.set("title", title.trim());
      fd.set("content", content);
      fd.set("tags", tags);
      if (file) fd.set("file", file);
      const res = await fetch(`/api/mindmap/nodes/${node.id}/attach-note`, { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { node?: MindMapNodeDTO; error?: string };
      if (!res.ok) {
        onError(data.error || "上传失败");
        onBusy(false);
        return;
      }
      if (data.node) onDone(data.node);
      else onBusy(false);
    } catch {
      onError("网络错误");
      onBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">节点</p>
      <p className="text-sm font-medium text-slate-800">{node.title}</p>
      {node.isRoot ? <p className="text-[11px] text-slate-500">课程根节点，可挂总览笔记。</p> : null}
      <form onSubmit={(e) => void submit(e)} className="mt-3 space-y-2">
        <div>
          <label className="text-[11px] text-slate-500">标题</label>
          <input
            className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800"
            value={title}
            disabled={disabled}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[11px] text-slate-500">内容（可选）</label>
          <textarea
            className="mt-0.5 min-h-[80px] w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800"
            value={content}
            disabled={disabled}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[11px] text-slate-500">标签（逗号分隔）</label>
          <input
            className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800"
            value={tags}
            disabled={disabled}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[11px] text-slate-500">
            附件（PDF / 图片；配置 Supabase 后可云端保存并生成便签缩略图）
          </label>
          <input
            type="file"
            className="mt-0.5 w-full text-xs text-slate-600"
            disabled={disabled}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <button
          type="submit"
          disabled={disabled}
          className="w-full rounded-xl bg-emerald-500 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600 disabled:opacity-50"
        >
          保存到该节点
        </button>
      </form>
    </div>
  );
}
