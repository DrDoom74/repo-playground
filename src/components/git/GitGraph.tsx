import { memo, useMemo } from 'react';
import { RepoState } from '@/git/types';
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface GitGraphProps {
  state: RepoState;
  height?: number | string;
}

export const GitGraph = memo(({ state, height = 420 }: GitGraphProps) => {
  const { nodes, edges } = useMemo(() => toFlow(state), [state]);
  return (
    <div style={{ height }}>
      <ReactFlow nodes={nodes} edges={edges} fitView={true} proOptions={{ hideAttribution: true }}>
        <MiniMap zoomable pannable />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
});

function toFlow(state: RepoState) {
  const nodes: any[] = [];
  const edges: any[] = [];
  // simple layout: assign y by depth, x by index
  const depth = new Map<string, number>();
  const order = Object.keys(state.commits);
  const computeDepth = (id: string): number => {
    if (depth.has(id)) return depth.get(id)!;
    const parents = state.commits[id]?.parents || [];
    const d = parents.length ? Math.max(...parents.map(computeDepth)) + 1 : 0;
    depth.set(id, d);
    return d;
  };
  order.forEach(computeDepth);
  const ids = Object.keys(state.commits);
  ids.forEach((id, i) => {
    const d = computeDepth(id);
    const isHead = (state.head.type === 'branch' && state.branches[state.head.ref]?.tip === id) || (state.head.type === 'detached' && state.head.ref === id);
    const branchLabels = Object.values(state.branches).filter((b) => b.tip === id).map((b) => b.name);
    nodes.push({
      id,
      position: { x: 120 + i * 80, y: 50 + d * 90 },
      data: { label: `${id}${isHead ? ' •HEAD' : ''}${branchLabels.length ? ' •' + branchLabels.join(',') : ''}` },
      style: { padding: 8, borderRadius: 8, border: '1px solid hsl(var(--border))' },
    });
    for (const p of state.commits[id]?.parents || []) {
      edges.push({ id: `${id}-${p}`, source: id, target: p, animated: false });
    }
  });
  return { nodes, edges };
}
