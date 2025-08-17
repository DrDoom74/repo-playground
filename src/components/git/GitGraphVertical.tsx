import { memo, useMemo } from 'react';
import { RepoState, CommitID } from '@/git/types';

interface GitGraphVerticalProps {
  state: RepoState;
  height?: number;
  width?: number;
}

interface LayoutCommit {
  id: CommitID;
  x: number;
  y: number;
  color: string;
  isHead: boolean;
  branches: string[];
  message: string;
}

interface LayoutPath {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
}

// Layout constants
const COMMIT_RADIUS = 6;
const COMMIT_SPACING_Y = 60;
const LANE_WIDTH = 50;
const PADDING = 40;
const HEAD_ZONE_WIDTH = 80;
const MESSAGE_ZONE_WIDTH = 160;

const BRANCH_COLORS = [
  'hsl(var(--primary))',
  'hsl(145, 60%, 50%)', // green  
  'hsl(340, 75%, 60%)', // pink
  'hsl(25, 85%, 60%)',  // orange
  'hsl(260, 70%, 65%)', // purple
  'hsl(190, 70%, 55%)', // cyan
];

export const GitGraphVertical = memo(({ state, height = 400, width = 600 }: GitGraphVerticalProps) => {
  const layout = useMemo(() => computeVerticalLayout(state, width), [state, width]);

  if (!layout) return null;

  // Calculate vertical offset to push graph to bottom when few commits
  const verticalOffset = Math.max(0, height - layout.height - PADDING);

  return (
    <div className="w-full">
      <svg
        width={layout.width}
        height={Math.max(height, layout.height)}
        className="border border-border rounded bg-card"
      >
        {/* Background */}
        <rect
          width="100%"
          height="100%"
          fill="hsl(var(--card))"
        />
        
        <g transform={`translate(0, ${verticalOffset})`}>
        {/* Connection paths - strictly orthogonal */}
        {layout.paths.map((path, index) => (
          <g key={`path-${index}`}>
            {path.from.x === path.to.x ? (
              // Straight vertical line for same lane
              <line
                x1={path.from.x}
                y1={path.from.y}
                x2={path.to.x}
                y2={path.to.y}
                stroke={path.color}
                strokeWidth="2"
                strokeLinecap="round"
              />
            ) : (
              // Orthogonal path: vertical down from parent, horizontal, vertical up to child
              <path
                d={`M ${path.from.x},${path.from.y} V ${path.from.y + 15} H ${path.to.x} V ${path.to.y}`}
                stroke={path.color}
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </g>
        ))}

        {/* Commit circles and labels */}
        {layout.commits.map((commit) => (
          <g key={commit.id}>
            {/* Commit circle */}
            <circle
              cx={commit.x}
              cy={commit.y}
              r={COMMIT_RADIUS}
              fill={commit.color}
              stroke="hsl(var(--border))"
              strokeWidth="1"
              className="drop-shadow-sm"
            />
            
            {/* Commit ID */}
            <text
              x={commit.x}
              y={commit.y + 1}
              textAnchor="middle"
              className="text-xs fill-card-foreground font-mono font-bold pointer-events-none"
            >
              {commit.id}
            </text>
            
            {/* Commit message */}
            <text
              x={commit.x + HEAD_ZONE_WIDTH + MESSAGE_ZONE_WIDTH}
              y={commit.y + 1}
              className="text-sm fill-foreground font-mono pointer-events-none"
            >
              {commit.message}
            </text>
            
            {/* HEAD indicator */}
            {commit.isHead && (
              <g>
                <rect
                  x={commit.x + 15}
                  y={commit.y - 8}
                  width={30}
                  height={16}
                  rx="3"
                  fill="hsl(var(--primary))"
                  className="drop-shadow-sm"
                />
                <text
                  x={commit.x + 30}
                  y={commit.y + 1}
                  textAnchor="middle"
                  className="text-xs fill-primary-foreground font-bold pointer-events-none"
                >
                  HEAD
                </text>
              </g>
            )}
            
            {/* Branch labels */}
            {commit.branches.map((branch, branchIndex) => {
              const labelWidth = Math.max(50, branch.length * 8 + 16);
              const labelX = commit.x + 50 + (branchIndex * (labelWidth + 10));
              return (
                <g key={`${commit.id}-${branch}`}>
                  <rect
                    x={labelX}
                    y={commit.y - 8}
                    width={labelWidth}
                    height={16}
                    rx="8"
                    fill="hsl(var(--secondary))"
                    stroke="hsl(var(--border))"
                    strokeWidth="1"
                    className="drop-shadow-sm"
                  />
                  <text
                    x={labelX + labelWidth / 2}
                    y={commit.y + 1}
                    textAnchor="middle"
                    className="text-xs fill-secondary-foreground font-medium pointer-events-none"
                  >
                    {branch}
                  </text>
                </g>
              );
            })}
          </g>
        ))}
        
        {/* Legend */}
        <text
          x={10}
          y={30}
          className="text-xs fill-muted-foreground font-mono"
        >
          * Git graph: oldest ↓ to newest ↑
        </text>
        </g>
      </svg>
    </div>
  );
});

function computeVerticalLayout(state: RepoState, containerWidth: number): {
  commits: LayoutCommit[];
  paths: LayoutPath[];
  width: number;
  height: number;
} | null {
  if (Object.keys(state.commits).length === 0) return null;

  // Topological sort: newest commits first, then their parents
  const sorted = topologicalSort(state);
  if (sorted.length === 0) return null;

  // Reverse for bottom-up layout (oldest at bottom, newest at top)
  const orderedCommits = sorted.reverse();

  // Lanes algorithm: assign stable lanes to commits
  const commitLanes = new Map<string, number>();
  const activeLanes = new Set<number>();
  const branchColors = new Map<string, string>();
  
  // Assign colors to branches
  Object.values(state.branches).forEach((branch, i) => {
    branchColors.set(branch.name, BRANCH_COLORS[i % BRANCH_COLORS.length]);
  });

  // Process commits from oldest to newest
  orderedCommits.forEach((commit, index) => {
    let assignedLane = 0;
    
    if (index === 0) {
      // First (oldest) commit gets lane 0
      assignedLane = 0;
    } else {
      // Try to continue on parent's lane
      const parentLanes = commit.parents
        .map(p => commitLanes.get(p))
        .filter(lane => lane !== undefined) as number[];
      
      if (parentLanes.length > 0) {
        // Use first parent's lane if available
        assignedLane = parentLanes[0];
      } else {
        // Find next available lane
        while (activeLanes.has(assignedLane)) {
          assignedLane++;
        }
      }
    }
    
    commitLanes.set(commit.id, assignedLane);
    activeLanes.add(assignedLane);
  });

  // Get HEAD commit ID
  const headCommitId = state.head.type === 'branch' 
    ? state.branches[state.head.ref]?.tip 
    : state.head.ref;

  // Create commit positions (bottom-up: oldest at bottom, newest at top)
  const maxLane = Math.max(...Array.from(commitLanes.values()));
  const graphWidth = HEAD_ZONE_WIDTH + (maxLane + 1) * LANE_WIDTH + MESSAGE_ZONE_WIDTH + 300;
  const centerOffset = Math.max(0, (containerWidth - graphWidth) / 2);
  
  const layoutCommits: LayoutCommit[] = orderedCommits.map((commit, index) => {
    const lane = commitLanes.get(commit.id) || 0;
    const x = centerOffset + HEAD_ZONE_WIDTH + lane * LANE_WIDTH;
    const y = PADDING + (orderedCommits.length - 1 - index) * COMMIT_SPACING_Y; // Bottom-up
    
    // Determine branch color
    let color = BRANCH_COLORS[lane % BRANCH_COLORS.length];
    for (const [name, branch] of Object.entries(state.branches)) {
      if (isCommitOnBranch(state, commit.id, name)) {
        color = branchColors.get(name) || color;
        break;
      }
    }
    
    // Find branches that point to this commit
    const branches: string[] = [];
    for (const [name, branch] of Object.entries(state.branches)) {
      if (branch.tip === commit.id) {
        branches.push(name);
      }
    }
    
    return {
      id: commit.id,
      x,
      y,
      color,
      message: commit.message,
      branches,
      isHead: commit.id === headCommitId,
    };
  });

  // Create paths between commits
  const paths: LayoutPath[] = [];
  layoutCommits.forEach((commit) => {
    const commitData = orderedCommits.find(c => c.id === commit.id);
    if (!commitData) return;

    commitData.parents.forEach((parentId) => {
      const parentCommit = layoutCommits.find(c => c.id === parentId);
      if (!parentCommit) return;

      // Color based on the child commit's branch
      let pathColor = commit.color;

      paths.push({
        from: { x: parentCommit.x, y: parentCommit.y }, // Parent (below)
        to: { x: commit.x, y: commit.y },               // Child (above)
        color: pathColor,
      });
    });
  });

  return {
    commits: layoutCommits,
    paths,
    width: Math.max(containerWidth, graphWidth + centerOffset * 2),
    height: PADDING * 2 + orderedCommits.length * COMMIT_SPACING_Y,
  };
}

// Helper function to check if commit belongs to branch
function isCommitOnBranch(state: RepoState, commitId: string, branchName: string): boolean {
  const branch = state.branches[branchName];
  if (!branch) return false;
  
  // Simple check: is this commit the tip or an ancestor of the tip?
  let current = branch.tip;
  const visited = new Set<string>();
  
  while (current && !visited.has(current)) {
    if (current === commitId) return true;
    visited.add(current);
    
    const commit = state.commits[current];
    if (!commit || commit.parents.length === 0) break;
    
    // Follow first parent
    current = commit.parents[0];
  }
  
  return false;
}

function topologicalSort(state: RepoState) {
  const visited = new Set<string>();
  const result: Array<{ id: string; parents: string[]; message: string }> = [];
  
  function visit(commitId: string) {
    if (visited.has(commitId) || !state.commits[commitId]) return;
    visited.add(commitId);
    
    const commit = state.commits[commitId];
    result.push(commit);
    
    // Visit parents after adding current commit
    commit.parents.forEach(parentId => visit(parentId));
  }
  
  // Start from all branch tips
  Object.values(state.branches).forEach(branch => visit(branch.tip));
  
  return result;
}