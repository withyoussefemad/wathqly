"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type PointerEvent as ReactPointerEvent } from "react";
import {
  Bot, Check, ChevronRight, Circle, Copy, Download, FileUp, Focus, Grid3X3,
  Hand, Link2, Maximize2, MousePointer2, Plus, RectangleHorizontal, Sparkles,
  Trash2, Type, WandSparkles, ZoomIn, ZoomOut,
} from "lucide-react";
import {
  createEmptyBoard,
  type CreativeBoardConnector,
  type CreativeBoardElement,
  type CreativeBoardElementKind,
  type CreativeBoardModel,
} from "@/features/creative/whiteboard";
import { clampViewport, getConnectorPath, screenToWorld, snapValue } from "@/features/creative/whiteboard-engine";
import { analyzeWhiteboardAction } from "@/actions/ai";
import { saveCreativeBoardAction } from "@/actions/creative";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const PALETTE = ["#7c3aed", "#2563eb", "#059669", "#ea580c", "#db2777"];
const now = () => new Date().toISOString();

const seedElements: CreativeBoardElement[] = [
  { id: "vision", type: "rectangle", x: 110, y: 90, width: 250, height: 150, rotation: 0, zIndex: 1, title: "Product vision", text: "One connected workspace for every workflow.", backgroundColor: "#ede9fe", borderColor: "#7c3aed", borderWidth: 2, fontSize: 16, createdBy: "demo", createdAt: now(), updatedAt: now() },
  { id: "systems", type: "rectangle", x: 520, y: 40, width: 280, height: 160, rotation: 0, zIndex: 1, title: "Core systems", text: "CRM · Knowledge · Planning · AI", backgroundColor: "#dbeafe", borderColor: "#2563eb", borderWidth: 2, fontSize: 16, createdBy: "demo", createdAt: now(), updatedAt: now() },
  { id: "experience", type: "rectangle", x: 880, y: 250, width: 260, height: 150, rotation: 0, zIndex: 1, title: "Team experience", text: "Fast, secure, collaborative by default.", backgroundColor: "#d1fae5", borderColor: "#059669", borderWidth: 2, fontSize: 16, createdBy: "demo", createdAt: now(), updatedAt: now() },
];

const seedConnectors: CreativeBoardConnector[] = [
  { id: "c1", sourceElementId: "vision", targetElementId: "systems", type: "curved", color: "#7c3aed", width: 3, style: "solid", startArrow: "none", endArrow: "arrow", createdBy: "demo", createdAt: now(), updatedAt: now() },
  { id: "c2", sourceElementId: "systems", targetElementId: "experience", type: "curved", color: "#2563eb", width: 3, style: "solid", startArrow: "none", endArrow: "arrow", createdBy: "demo", createdAt: now(), updatedAt: now() },
];

const elementKinds: CreativeBoardElementKind[] = ["sticky", "rectangle", "circle", "text"];

export function WhiteboardNative({ initialBoardId }: { initialBoardId: string }) {
  const [board, setBoard] = useState<CreativeBoardModel>(() => ({
    ...createEmptyBoard("workspace-demo", "Product architecture", "demo"),
    id: initialBoardId,
    elements: seedElements,
    connectors: seedConnectors,
    viewport: { x: 80, y: 70, zoom: 1 },
  }));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTool, setActiveTool] = useState<"select" | "pan" | "connector">("select");
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [panning, setPanning] = useState<{ x: number; y: number; viewportX: number; viewportY: number } | null>(null);
  const [analysis, setAnalysis] = useState<{ summary: string; priorities: string[]; recommendations: string[]; nextSteps: string[] } | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisPrompt, setAnalysisPrompt] = useState("What are the biggest opportunities to improve this board?");
  const [analysisMessage, setAnalysisMessage] = useState("");
  const [syncState, setSyncState] = useState("Saved");
  const [toast, setToast] = useState("");
  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedElement = useMemo(() => board.elements.find((element) => element.id === selectedIds[0]), [board.elements, selectedIds]);

  const updateBoard = useCallback((patch: Partial<CreativeBoardModel>) => {
    setBoard((current) => ({ ...current, ...patch, updatedAt: now() }));
  }, []);

  useEffect(() => {
    setSyncState("Saving…");
    const timeout = window.setTimeout(() => {
      void saveCreativeBoardAction({
        boardId: board.id,
        workspaceId: board.workspaceId,
        elements: board.elements,
        connectors: board.connectors,
      }).then((result) => setSyncState(result.success ? "Saved" : "Save failed"));
    }, 450);
    return () => window.clearTimeout(timeout);
  }, [board.elements, board.connectors, board.id, board.workspaceId]);

  const addElement = (type: CreativeBoardElementKind) => {
    const id = crypto.randomUUID();
    const element: CreativeBoardElement = {
      id, type, x: snapValue(100 + board.elements.length * 32, board.gridSize), y: snapValue(90 + board.elements.length * 25, board.gridSize),
      width: type === "circle" ? 170 : 240, height: type === "circle" ? 170 : 130, rotation: 0, zIndex: Math.max(0, ...board.elements.map((item) => item.zIndex)) + 1,
      title: type === "text" ? "New text" : "New idea", text: type === "text" ? "Add your thinking here" : "Describe this concept…",
      backgroundColor: type === "sticky" ? "#fef3c7" : "#ffffff", borderColor: PALETTE[board.elements.length % PALETTE.length], borderWidth: 2,
      fontSize: 15, createdBy: "demo", createdAt: now(), updatedAt: now(),
    };
    updateBoard({ elements: [...board.elements, element], selectedElementIds: [id] });
    setActiveTool("select");
  };

  const addConnector = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const connector: CreativeBoardConnector = {
      id: crypto.randomUUID(), sourceElementId: sourceId, targetElementId: targetId, type: "curved", color: "#7c3aed", width: 3, style: "solid",
      startArrow: "none", endArrow: "arrow", createdBy: "demo", createdAt: now(), updatedAt: now(),
    };
    updateBoard({ connectors: [...board.connectors, connector], selectedElementIds: [sourceId] });
    setConnectingFrom(null);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button === 1 || activeTool === "pan") {
      event.currentTarget.setPointerCapture(event.pointerId);
      setPanning({ x: event.clientX, y: event.clientY, viewportX: board.viewport.x, viewportY: board.viewport.y });
      return;
    }
    if (event.target === event.currentTarget) {
      setSelectedIds([]);
      setConnectingFrom(null);
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (panning) {
      updateBoard({ viewport: clampViewport({ ...board.viewport, x: panning.viewportX + event.clientX - panning.x, y: panning.viewportY + event.clientY - panning.y }) });
      return;
    }
    if (!dragging) return;
    const world = screenToWorld({ x: event.clientX, y: event.clientY }, board.viewport);
    updateBoard({ elements: board.elements.map((element) => element.id === dragging.id ? {
      ...element,
      x: snapValue(Math.max(-1000, world.x - dragging.offsetX), board.gridSize),
      y: snapValue(Math.max(-1000, world.y - dragging.offsetY), board.gridSize),
      updatedAt: now(),
    } : element) });
  };

  const handlePointerUp = () => { setDragging(null); setPanning(null); };

  const startNodeDrag = (event: ReactPointerEvent<HTMLDivElement>, element: CreativeBoardElement) => {
    event.stopPropagation();
    setSelectedIds([element.id]);
    const world = screenToWorld({ x: event.clientX, y: event.clientY }, board.viewport);
    setDragging({ id: element.id, offsetX: world.x - element.x, offsetY: world.y - element.y });
    if (activeTool === "connector") {
      setConnectingFrom(element.id);
      setActiveTool("select");
    }
  };

  const handleNodeClick = (id: string) => {
    if (activeTool === "connector") {
      if (!connectingFrom) setConnectingFrom(id);
      else if (connectingFrom !== id) addConnector(connectingFrom, id);
      return;
    }
    setSelectedIds([id]);
  };

  const updateSelected = (patch: Partial<CreativeBoardElement>) => {
    if (!selectedElement) return;
    updateBoard({ elements: board.elements.map((element) => element.id === selectedElement.id ? { ...element, ...patch, updatedAt: now() } : element) });
  };

  const duplicateSelected = () => {
    if (!selectedElement) return;
    const copy = { ...selectedElement, id: crypto.randomUUID(), x: selectedElement.x + 30, y: selectedElement.y + 30, title: `${selectedElement.title} copy` };
    updateBoard({ elements: [...board.elements, copy], selectedElementIds: [copy.id] });
  };

  const deleteSelected = () => {
    if (!selectedElement) return;
    updateBoard({ elements: board.elements.filter((element) => element.id !== selectedElement.id), connectors: board.connectors.filter((connector) => connector.sourceElementId !== selectedElement.id && connector.targetElementId !== selectedElement.id), selectedElementIds: [] });
  };

  const setZoom = (zoom: number) => updateBoard({ viewport: clampViewport({ ...board.viewport, zoom }) });
  const resetViewport = () => updateBoard({ viewport: { x: 80, y: 70, zoom: 1 } });

  const runAnalysis = async () => {
    setAnalysisLoading(true);
    setAnalysisMessage("");
    try {
      const response = await analyzeWhiteboardAction({
        prompt: analysisPrompt,
        nodes: board.elements.map(({ id, title, text, type }) => ({ id, name: title || "Untitled", description: text || "", kind: type })),
        connectors: board.connectors.map(({ id, sourceElementId, targetElementId, label }) => ({ id, sourceNodeId: sourceElementId, targetNodeId: targetElementId, label: label || "relates to" })),
      });
      if (!response.success) {
        setAnalysisMessage(response.message || "The analysis could not be completed.");
        return;
      }
      setAnalysis({ summary: response.summary || "", priorities: response.priorities || [], recommendations: response.recommendations || [], nextSteps: response.nextSteps || [] });
    } catch {
      setAnalysisMessage("The analysis could not be completed. Try again.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const exportBoard = () => {
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: now(), board }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${board.name.toLowerCase().replace(/\s+/g, "-")}.wathqly.json`;
    link.click();
    URL.revokeObjectURL(url);
    setToast("Board exported");
  };

  const importBoard = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const imported = JSON.parse(await file.text()) as Partial<CreativeBoardModel>;
    if (imported.elements && imported.connectors) updateBoard({ elements: imported.elements, connectors: imported.connectors, name: imported.name || board.name });
    setToast("Board imported");
  };

  const applyTemplate = () => {
    const template = seedElements.map((element, index) => ({ ...element, id: crypto.randomUUID(), x: element.x + index * 30, y: element.y + index * 20 }));
    updateBoard({ elements: template, connectors: seedConnectors.map((connector) => ({ ...connector, id: crypto.randomUUID() })), selectedElementIds: [] });
    setToast("Mind-map template applied");
  };

  const connectorPath = (connector: CreativeBoardConnector) => {
    const source = board.elements.find((element) => element.id === connector.sourceElementId);
    const target = board.elements.find((element) => element.id === connector.targetElementId);
    return source && target ? getConnectorPath(source, target, connector.type, connector.points) : "";
  };

  const worldSize = useMemo(() => ({
    width: Math.max(1400, ...board.elements.map((element) => element.x + element.width)),
    height: Math.max(1000, ...board.elements.map((element) => element.y + element.height)),
  }), [board.elements]);

  return (
    <div className="min-h-[72vh] space-y-4">
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="min-w-0 overflow-hidden border-border/80 shadow-sm">
          <CardHeader className="flex flex-col gap-3 border-b border-border bg-card px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Button size="sm" onClick={() => addElement("sticky")} title="Add a sticky note"><Plus className="h-4 w-4" /> Idea</Button>
              <Button variant={activeTool === "connector" ? "default" : "outline"} size="sm" onClick={() => setActiveTool(activeTool === "connector" ? "select" : "connector")} title="Connect two ideas"><Link2 className="h-4 w-4" /> {activeTool === "connector" ? "Cancel" : "Connect"}</Button>
              <Button variant="ghost" size="sm" onClick={applyTemplate} title="Replace the board with a starter template"><WandSparkles className="h-4 w-4" /> Template</Button>
            </div>
            <div className="flex min-w-0 items-center justify-between gap-2 sm:justify-end">
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-700/15 bg-emerald-700/5 px-2.5 py-1 text-[11px] font-medium text-emerald-800 dark:text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />{syncState}</span>
              <Input value={board.name} onChange={(event) => updateBoard({ name: event.target.value })} className="h-8 min-w-0 max-w-44" aria-label="Board name" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative h-[min(72vh,760px)] min-h-110 overflow-hidden bg-[#f4f7f5] dark:bg-[#111715] sm:min-h-140">
              <div className="absolute left-3 top-3 z-30 flex items-center gap-1 rounded-lg border border-border/80 bg-background/95 p-1 shadow-sm backdrop-blur-sm">
                <Button variant={activeTool === "select" ? "default" : "ghost"} size="icon-sm" onClick={() => setActiveTool("select")} title="Select and move" aria-label="Select and move"><MousePointer2 className="h-4 w-4" /></Button>
                <Button variant={activeTool === "pan" ? "default" : "ghost"} size="icon-sm" onClick={() => setActiveTool(activeTool === "pan" ? "select" : "pan")} title="Pan canvas" aria-label="Pan canvas"><Hand className="h-4 w-4" /></Button>
                <span className="mx-0.5 h-5 w-px bg-border" />
                {elementKinds.map((type) => <Button key={type} variant="ghost" size="icon-sm" onClick={() => addElement(type)} aria-label={`Add ${type}`} title={`Add ${type}`}>{type === "text" ? <Type className="h-4 w-4" /> : type === "circle" ? <Circle className="h-4 w-4" /> : <RectangleHorizontal className="h-4 w-4" />}</Button>)}
              </div>
              <div className="absolute right-3 top-3 z-30 flex items-center gap-1 rounded-lg border border-border/80 bg-background/95 p-1 shadow-sm backdrop-blur-sm">
                <Button variant="ghost" size="icon-sm" onClick={() => setZoom(board.viewport.zoom - 0.1)} title="Zoom out" aria-label="Zoom out"><ZoomOut className="h-4 w-4" /></Button>
                <span className="w-10 text-center text-[11px] font-medium tabular-nums">{Math.round(board.viewport.zoom * 100)}%</span>
                <Button variant="ghost" size="icon-sm" onClick={() => setZoom(board.viewport.zoom + 0.1)} title="Zoom in" aria-label="Zoom in"><ZoomIn className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon-sm" onClick={resetViewport} title="Reset view" aria-label="Reset view"><Maximize2 className="h-4 w-4" /></Button>
              </div>
              <div ref={canvasRef} className={`absolute inset-0 touch-none overflow-hidden ${activeTool === "pan" ? "cursor-grabbing" : "cursor-default"}`} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
                <div className="absolute left-0 top-0 origin-top-left" style={{ width: worldSize.width, height: worldSize.height, transform: `translate(${board.viewport.x}px, ${board.viewport.y}px) scale(${board.viewport.zoom})` }}>
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(78,115,98,.11)_1px,transparent_1px),linear-gradient(to_bottom,rgba(78,115,98,.11)_1px,transparent_1px)] bg-size-[24px_24px] dark:bg-[linear-gradient(to_right,rgba(148,177,159,.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,177,159,.1)_1px,transparent_1px)]" />
                  <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-label="Whiteboard connectors">
                    <defs><marker id="board-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0 0 9 4.5 0 9Z" fill="#7c3aed" /></marker></defs>
                    {board.connectors.map((connector) => {
                      const path = connectorPath(connector);
                      return path ? <path key={connector.id} d={path} fill="none" stroke={connector.color} strokeWidth={connector.width} strokeDasharray={connector.style === "dashed" ? "8 6" : undefined} markerEnd={connector.endArrow === "arrow" ? "url(#board-arrow)" : undefined} /> : null;
                    })}
                  </svg>
                  {board.elements.map((element) => {
                    const selected = selectedIds.includes(element.id);
                    return <div key={element.id} role="button" tabIndex={0} onPointerDown={(event) => startNodeDrag(event, element)} onClick={(event) => { event.stopPropagation(); handleNodeClick(element.id); }} className={`absolute select-none rounded-xl border bg-white/95 p-4 shadow-[0_14px_36px_rgba(15,23,42,.08)] backdrop-blur ${selected ? "z-20 border-primary ring-4 ring-primary/10" : "z-10 border-slate-200 hover:z-20 hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-900"}`} style={{ left: element.x, top: element.y, width: element.width, height: element.height, transform: `rotate(${element.rotation}deg)`, borderColor: element.borderColor, borderWidth: element.borderWidth, backgroundColor: element.backgroundColor, opacity: element.opacity ?? 1, zIndex: element.zIndex }}>
                      <div className="mb-2 flex items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{element.type}</span>{selected && <button className="rounded p-1 text-slate-500 hover:bg-slate-100" onClick={(event) => { event.stopPropagation(); deleteSelected(); }}><Trash2 className="h-3.5 w-3.5" /></button>}</div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{element.title}</p>
                      {element.text && <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-slate-500 dark:text-zinc-400">{element.text}</p>}
                    </div>;
                  })}
                  {connectingFrom && <div className="absolute left-4 top-4 z-30 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-white shadow-lg">Choose a target node</div>}
                </div>
              </div>
              <div className="pointer-events-none absolute bottom-3 left-3 z-20 rounded-md border border-border/80 bg-background/90 px-2.5 py-1.5 text-[10px] text-muted-foreground shadow-sm backdrop-blur-sm sm:bottom-4 sm:left-4 sm:text-[11px]">Drag to arrange <span className="mx-1 text-border">/</span> Use pan to move around</div>
            </div>
          </CardContent>
        </Card>

        <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-1 xl:content-start">
          <Card className="min-w-0 overflow-hidden border-emerald-900/15">
            <CardHeader className="border-b border-border/70 bg-[linear-gradient(115deg,rgba(16,120,90,.08),transparent_70%)] px-4 py-3"><CardTitle className="flex items-center gap-2 text-sm"><span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-700/10 text-emerald-800 dark:text-emerald-300"><Sparkles className="h-4 w-4" /></span>Gemini co-pilot</CardTitle></CardHeader>
            <CardContent className="space-y-3 p-4">
              <p className="text-xs leading-relaxed text-muted-foreground">Ask for a review of the ideas and connections on this board.</p>
              <Input value={analysisPrompt} onChange={(event) => setAnalysisPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void runAnalysis(); }} placeholder="What should we improve?" aria-label="Ask Gemini about this board" />
              <Button className="w-full bg-emerald-800 text-white hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600" onClick={runAnalysis} disabled={analysisLoading || !analysisPrompt.trim()}>{analysisLoading ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> Reviewing board…</> : <><Bot className="h-4 w-4" /> Ask Gemini</>}</Button>
              {analysisMessage && <p role="alert" className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">{analysisMessage}</p>}
              {analysis && <div className="space-y-3 border-t border-border pt-3 text-xs">
                <div><p className="font-semibold text-foreground">Summary</p><p className="mt-1 leading-relaxed text-muted-foreground">{analysis.summary}</p></div>
                {analysis.priorities.length > 0 && <div><p className="mb-1.5 font-semibold text-foreground">Priorities</p><ul className="space-y-1.5">{analysis.priorities.map((item) => <li key={item} className="flex gap-2 leading-relaxed"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" /><span>{item}</span></li>)}</ul></div>}
                {analysis.recommendations.length > 0 && <div><p className="mb-1.5 font-semibold text-foreground">Recommendations</p><ul className="space-y-1.5">{analysis.recommendations.map((item) => <li key={item} className="flex gap-2 leading-relaxed"><ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" /><span>{item}</span></li>)}</ul></div>}
                {analysis.nextSteps.length > 0 && <div><p className="mb-1.5 font-semibold text-foreground">Next steps</p><ol className="list-inside list-decimal space-y-1.5 text-muted-foreground">{analysis.nextSteps.map((item) => <li key={item} className="leading-relaxed">{item}</li>)}</ol></div>}
              </div>}
            </CardContent>
          </Card>
          <Card className="min-w-0">
            <CardHeader className="border-b border-border/70 px-4 py-3"><CardTitle className="flex items-center gap-2 text-sm"><Focus className="h-4 w-4 text-muted-foreground" />Inspector</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {selectedElement ? <><label className="block space-y-1.5"><span className="text-[11px] font-medium text-muted-foreground">Title</span><Input value={selectedElement.title || ""} onChange={(event) => updateSelected({ title: event.target.value })} /></label><label className="block space-y-1.5"><span className="text-[11px] font-medium text-muted-foreground">Description</span><Input value={selectedElement.text || ""} onChange={(event) => updateSelected({ text: event.target.value })} /></label><div className="grid grid-cols-2 gap-2"><Button size="sm" variant="outline" onClick={duplicateSelected}><Copy className="h-3.5 w-3.5" /> Duplicate</Button><Button size="sm" variant="outline" onClick={deleteSelected}><Trash2 className="h-3.5 w-3.5" /> Delete</Button></div></> : <p className="text-xs leading-relaxed text-muted-foreground">Select an idea on the canvas to edit its details.</p>}
            </CardContent>
          </Card>
          <Card className="min-w-0 sm:col-span-2 xl:col-span-1">
            <CardHeader className="border-b border-border/70 px-4 py-3"><CardTitle className="flex items-center gap-2 text-sm"><Grid3X3 className="h-4 w-4 text-muted-foreground" />Board tools</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-2"><label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-xs hover:bg-muted"><FileUp className="h-3.5 w-3.5" /> Import<input className="hidden" type="file" accept="application/json" onChange={importBoard} /></label><Button size="sm" variant="outline" onClick={exportBoard}><Download className="h-3.5 w-3.5" /> Export</Button></CardContent>
          </Card>
        </div>
      </div>
      {toast && <div className="fixed bottom-5 right-5 z-50 rounded-md bg-foreground px-4 py-2 text-xs text-background shadow-xl" onClick={() => setToast("")}>{toast}</div>}
    </div>
  );
}

export default WhiteboardNative;
