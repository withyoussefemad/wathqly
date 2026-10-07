"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createCreativeBoardAction,
  createCreativeConnectorAction,
  createCreativeNodeAction,
  getCreativeBoardsAction,
  getCreativeTemplatesAction,
} from "@/actions/creative";
import { analyzeWhiteboardAction } from "@/actions/ai";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Bot,
  Check,
  ChevronRight,
  Copy,
  Focus,
  Layers3,
  Link2,
  MousePointer2,
  Plus,
  RefreshCcw,
  Sparkles,
  Trash2,
  WandSparkles,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

interface WhiteboardExperienceProps {
  initialBoardId: string;
}

type Node = {
  id: string;
  name: string;
  description: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  kind: string;
};

type Connector = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  label: string;
  color: string;
};

const seedNodes: Node[] = [
  { id: "product-vision", name: "Product vision", description: "One connected workspace for every workflow.", x: 80, y: 90, width: 230, height: 118, color: "#7c3aed", kind: "Idea" },
  { id: "core-systems", name: "Core systems", description: "CRM, knowledge, creativity and planning.", x: 390, y: 42, width: 230, height: 118, color: "#2563eb", kind: "Architecture" },
  { id: "team-experience", name: "Team experience", description: "Fast, secure and collaborative by default.", x: 690, y: 220, width: 230, height: 118, color: "#059669", kind: "Experience" },
  { id: "intelligence", name: "Intelligence", description: "Gemini-powered insights and automation.", x: 270, y: 310, width: 230, height: 118, color: "#ea580c", kind: "AI" },
];

const seedConnectors: Connector[] = [
  { id: "product-core", sourceNodeId: "product-vision", targetNodeId: "core-systems", label: "powers", color: "#7c3aed" },
  { id: "core-experience", sourceNodeId: "core-systems", targetNodeId: "team-experience", label: "delivers", color: "#2563eb" },
  { id: "core-intelligence", sourceNodeId: "core-systems", targetNodeId: "intelligence", label: "enhanced by", color: "#ea580c" },
];

const palette = ["#7c3aed", "#2563eb", "#059669", "#ea580c", "#db2777"];

export function WhiteboardExperience({ initialBoardId }: WhiteboardExperienceProps) {
  const [nodes, setNodes] = useState<Node[]>(seedNodes);
  const [connectors, setConnectors] = useState<Connector[]>(seedConnectors);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [isConnectMode, setIsConnectMode] = useState(false);
  const [boardName, setBoardName] = useState("Product architecture");
  const [syncState, setSyncState] = useState<"Live" | "Syncing…">("Live");
  const [zoom, setZoom] = useState(1);
  const [aiPrompt, setAiPrompt] = useState("What should we improve in this system?");
  const [analysis, setAnalysis] = useState<{ summary: string; priorities: string[]; recommendations: string[]; nextSteps: string[] } | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getCreativeBoardsAction().then(async (boards) => {
      if (!active) return;
      if (boards.length === 0) {
        await createCreativeBoardAction({ id: initialBoardId, name: boardName, description: "AI-assisted product architecture" });
      } else {
        setBoardName(boards[0].name);
      }
    });
    void getCreativeTemplatesAction();
    return () => { active = false; };
  }, [initialBoardId, boardName]);

  useEffect(() => {
    const client = createClient();
    const channel = client.channel("creative-realtime").on("postgres_changes", { event: "*", schema: "public", table: "creative_nodes" }, () => {
      setSyncState("Syncing…");
      window.setTimeout(() => setSyncState("Live"), 350);
    }).subscribe();
    return () => { void client.removeChannel(channel); };
  }, []);

  const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedId), [nodes, selectedId]);

  const persistNode = async (node: Node) => {
    await createCreativeNodeAction({ id: node.id, boardId: initialBoardId, name: node.name, x: node.x, y: node.y, width: node.width, height: node.height, color: node.color, description: node.description, kind: node.kind });
  };

  const addNode = () => {
    const id = globalThis.crypto.randomUUID();
    const node: Node = { id, name: "New idea", description: "Describe this concept…", x: 100 + nodes.length * 30, y: 110 + nodes.length * 20, width: 230, height: 115, color: palette[nodes.length % palette.length], kind: "Idea" };
    setNodes((current) => [...current, node]);
    void persistNode(node);
    setSelectedId(id);
  };

  const addConnector = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const connector: Connector = { id: globalThis.crypto.randomUUID(), sourceNodeId: sourceId, targetNodeId: targetId, label: "relates to", color: "#7c3aed" };
    setConnectors((current) => [...current, connector]);
    void createCreativeConnectorAction({ id: connector.id, boardId: initialBoardId, sourceNodeId: sourceId, targetNodeId: targetId, label: connector.label, color: connector.color });
  };

  const updateNode = (id: string, patch: Partial<Node>) => {
    setNodes((current) => current.map((node) => node.id === id ? { ...node, ...patch } : node));
  };

  const duplicateNode = () => {
    if (!selectedNode) return;
    const copy = { ...selectedNode, id: globalThis.crypto.randomUUID(), name: `${selectedNode.name} copy`, x: selectedNode.x + 24, y: selectedNode.y + 24 };
    setNodes((current) => [...current, copy]);
    void persistNode(copy);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setNodes((current) => current.filter((node) => node.id !== selectedId));
    setConnectors((current) => current.filter((connector) => connector.sourceNodeId !== selectedId && connector.targetNodeId !== selectedId));
    setSelectedId(null);
  };

  const runAnalysis = async () => {
    setAnalysisLoading(true);
    setAnalysisMessage("");
    const response = await analyzeWhiteboardAction({ prompt: aiPrompt, nodes, connectors });
    if (response.success) {
      setAnalysis({
        summary: response.summary ?? "The board was analyzed.",
        priorities: response.priorities ?? [],
        recommendations: response.recommendations ?? [],
        nextSteps: response.nextSteps ?? [],
      });
    } else {
      setAnalysisMessage(response.message ?? "The AI analysis could not be completed.");
    }
    setAnalysisLoading(false);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const dx = (event.clientX - rect.left) / zoom;
    const dy = (event.clientY - rect.top) / zoom;
    setNodes((current) => current.map((node) => node.id === draggingId ? { ...node, x: Math.max(20, Math.min(1080, dx - node.width / 2)), y: Math.max(20, Math.min(560, dy - node.height / 2)) } : node));
  };

  return (
    <div className="min-h-[72vh] space-y-5">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="overflow-hidden border-border/80">
          <CardHeader className="flex-row items-center justify-between gap-3 border-b border-border bg-card/95 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={addNode}><Plus className="h-4 w-4" /> Add idea</Button>
              <Button variant={isConnectMode ? "default" : "outline"} size="sm" onClick={() => { setIsConnectMode((value) => !value); setConnectingFrom(null); }}><Link2 className="h-4 w-4" /> {isConnectMode ? "Cancel link" : "Connect"}</Button>
              <Button variant="ghost" size="sm" onClick={() => setNodes(seedNodes)}><RefreshCcw className="h-4 w-4" /> Reset</Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {syncState}</span>
              <Input value={boardName} onChange={(event) => setBoardName(event.target.value)} className="h-8 w-40" aria-label="Board name" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative h-162.5 overflow-auto bg-[radial-gradient(circle_at_1px_1px,rgba(124,58,237,.09)_1px,transparent_0)] bg-size-[26px_26px]">
              <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-lg border border-border bg-background/95 px-3 py-2 text-xs shadow-sm backdrop-blur">
                <MousePointer2 className="h-3.5 w-3.5 text-primary" /> Drag ideas to arrange the system
              </div>
              <div className="absolute right-4 top-4 z-20 flex items-center gap-1 rounded-lg border border-border bg-background/95 p-1 shadow-sm">
                <Button variant="ghost" size="icon-sm" onClick={() => setZoom((value) => Math.max(0.75, value - 0.1))}><ZoomOut className="h-3.5 w-3.5" /></Button>
                <span className="w-10 text-center text-[11px]">{Math.round(zoom * 100)}%</span>
                <Button variant="ghost" size="icon-sm" onClick={() => setZoom((value) => Math.min(1.25, value + 0.1))}><ZoomIn className="h-3.5 w-3.5" /></Button>
              </div>
              <div className="relative h-280 w-370 transition-transform duration-200" style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }} onPointerMove={handlePointerMove} onPointerUp={() => setDraggingId(null)}>
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1480 1120" aria-label="Whiteboard connectors">
                  <defs><marker id="board-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#7c3aed" /></marker></defs>
                  {connectors.map((connector) => {
                    const source = nodes.find((node) => node.id === connector.sourceNodeId);
                    const target = nodes.find((node) => node.id === connector.targetNodeId);
                    if (!source || !target) return null;
                    return <line key={connector.id} x1={source.x + source.width / 2} y1={source.y + source.height / 2} x2={target.x + target.width / 2} y2={target.y + target.height / 2} stroke={connector.color} strokeWidth="2.5" strokeDasharray="7 6" markerEnd="url(#board-arrow)" />;
                  })}
                </svg>
                {nodes.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => {
                      setSelectedId(node.id);
                      if (isConnectMode && connectingFrom && connectingFrom !== node.id) {
                        addConnector(connectingFrom, node.id);
                        setConnectingFrom(null);
                      }
                    }}
                    onPointerDown={(event) => {
                      event.currentTarget.setPointerCapture(event.pointerId);
                      setDraggingId(node.id);
                      setSelectedId(node.id);
                      if (isConnectMode) setConnectingFrom(node.id);
                    }}
                    className={`absolute rounded-2xl border bg-background/95 p-4 text-left shadow-[0_16px_40px_rgba(15,23,42,.08)] backdrop-blur transition-all hover:-translate-y-0.5 ${selectedId === node.id ? "border-primary ring-4 ring-primary/10" : "border-border"}`}
                    style={{ left: node.x, top: node.y, width: node.width, height: node.height, borderTop: `4px solid ${node.color}` }}
                  >
                    <span className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: node.color }} /> {node.kind}</span>
                    <span className="block text-sm font-semibold text-foreground">{node.name}</span>
                    <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">{node.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit border-primary/20 bg-linear-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /> AI co-pilot</CardTitle><p className="text-xs text-muted-foreground">Analyze this board with Gemini.</p></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-primary/15 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">The model receives only the board’s current nodes and relationships, plus your prompt.</div>
            <Input value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} placeholder="Ask for a design review…" />
            <Button className="w-full" onClick={runAnalysis} disabled={analysisLoading}>{analysisLoading ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> Analyzing…</> : <><WandSparkles className="h-4 w-4" /> Ask Gemini</>}</Button>
            {analysisMessage && <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{analysisMessage}</p>}
            {analysis && <div className="space-y-3">{analysis.summary && <div className="rounded-md border border-border bg-background p-3"><p className="text-xs font-semibold">Executive summary</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{analysis.summary}</p></div>}{analysis.priorities.length > 0 && <div><p className="mb-2 text-xs font-semibold">Priorities</p><ul className="space-y-1.5">{analysis.priorities.map((item) => <li key={item} className="flex gap-2 text-xs"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />{item}</li>)}</ul></div>}{analysis.recommendations.length > 0 && <div><p className="mb-2 text-xs font-semibold">Recommendations</p><ul className="space-y-2">{analysis.recommendations.map((item) => <li key={item} className="flex gap-2 text-xs"><ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />{item}</li>)}</ul></div>}</div>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="border-border/80"><CardContent className="flex items-center gap-3 p-4"><Layers3 className="h-5 w-5 text-primary" /><div><p className="text-sm font-medium">{nodes.length} ideas</p><p className="text-xs text-muted-foreground">Connected spatial graph</p></div></CardContent></Card>
        <Card className="border-border/80"><CardContent className="flex items-center gap-3 p-4"><Link2 className="h-5 w-5 text-blue-500" /><div><p className="text-sm font-medium">{connectors.length} relationships</p><p className="text-xs text-muted-foreground">Live dependency map</p></div></CardContent></Card>
        <Card className="border-border/80"><CardContent className="flex items-center gap-3 p-4"><Sparkles className="h-5 w-5 text-emerald-500" /><div><p className="text-sm font-medium">Gemini integration</p><p className="text-xs text-muted-foreground">Server-side API call ready</p></div></CardContent></Card>
      </div>

      {selectedNode && <Card className="fixed bottom-5 right-5 z-50 w-77.5 border-primary/30 bg-background/95 p-4 shadow-2xl backdrop-blur"><div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Selected idea</p><p className="text-sm font-semibold">{selectedNode.name}</p></div><Button variant="ghost" size="icon-sm" onClick={deleteSelected}><Trash2 className="h-4 w-4 text-destructive" /></Button></div><Input value={selectedNode.name} onChange={(event) => updateNode(selectedNode.id, { name: event.target.value })} className="mb-2" /><Input value={selectedNode.description} onChange={(event) => updateNode(selectedNode.id, { description: event.target.value })} /><div className="mt-3 flex gap-2"><Button size="sm" variant="outline" className="flex-1" onClick={duplicateNode}><Copy className="h-3.5 w-3.5" /> Duplicate</Button><Button size="sm" onClick={() => setIsConnectMode(true)}><Focus className="h-3.5 w-3.5" /> Link</Button></div></Card>}
    </div>
  );
}
