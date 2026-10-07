export type MindMapNode = {
  id: string;
  label: string;
  parentId: string | null;
  x: number;
  y: number;
};

export function createMindMapTree(nodes: MindMapNode[]) {
  const byParent = new Map<string | null, MindMapNode[]>();
  for (const node of nodes) {
    const list = byParent.get(node.parentId) || [];
    list.push(node);
    byParent.set(node.parentId, list);
  }
  return byParent;
}
