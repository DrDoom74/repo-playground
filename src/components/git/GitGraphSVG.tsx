import { memo, useMemo } from 'react';
import { RepoState, CommitID } from '@/git/types';
import { getHeadCommitId } from '@/git/utils';

interface GitGraphSVGProps {
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
  branchLabels: string[];
  message: string;
  parents: CommitID[];
}

interface LayoutPath {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
}

const COMMIT_RADIUS = 8;
const COMMIT_SPACING_X = 60;
const BRANCH_SPACING_Y = 40;
const PADDING = 40;

const BRANCH_COLORS = [
  'hsl(220, 90%, 60%)', // blue
  'hsl(145, 60%, 50%)', // green  
  'hsl(340, 75%, 60%)', // pink
  'hsl(25, 85%, 60%)',  // orange
  'hsl(260, 70%, 65%)', // purple
  'hsl(190, 70%, 55%)', // cyan
];

export const GitGraphSVG = memo(({ state, height = 400, width = 800 }: GitGraphSVGProps) => {
  const { commits: layoutCommits, paths, dimensions } = useMemo(() => {
    return computeLayout(state);
  }, [state]);

  const actualWidth = Math.max(width, dimensions.width + PADDING * 2);
  const actualHeight = Math.max(height, dimensions.height + PADDING * 2);

  return (
    <div className="bg-card border border-border rounded-lg overflow-auto">
      <svg 
        width={actualWidth} 
        height={actualHeight}
        className="select-none"
        style={{ minWidth: actualWidth, minHeight: actualHeight }}
      >
        {/* Background */}
        <rect width="100%" height="100%" fill="hsl(var(--card))" />
        
        {/* Grid lines for reference */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Connection paths */}
        {paths.map((path, i) => (
          <line
            key={i}
            x1={path.from.x}
            y1={path.from.y}
            x2={path.to.x}
            y2={path.to.y}
            stroke={path.color}
            strokeWidth="2"
            strokeLinecap="round"
          />
        ))}
        
        {/* Commits */}
        {layoutCommits.map((commit) => (
          <g key={commit.id}>
            {/* Commit circle */}
            <circle
              cx={commit.x}
              cy={commit.y}
              r={COMMIT_RADIUS}
              fill={commit.color}
              stroke="hsl(var(--foreground))"
              strokeWidth={commit.isHead ? 3 : 1}
              className="transition-all duration-200"
            />
            
            {/* Commit ID */}
            <text
              x={commit.x}
              y={commit.y - COMMIT_RADIUS - 8}
              textAnchor="middle"
              className="text-sm font-mono font-semibold fill-foreground"
            >
              {commit.id}
            </text>
            
            {/* HEAD indicator */}
            {commit.isHead && (
              <text
                x={commit.x}
                y={commit.y + COMMIT_RADIUS + 20}
                textAnchor="middle"
                className="text-xs font-bold fill-primary"
              >
                HEAD
              </text>
            )}
            
            {/* Branch labels */}
            {commit.branchLabels.map((branch, i) => (
              <g key={branch}>
                <rect
                  x={commit.x + 15}
                  y={commit.y - 8 + i * 16}
                  width={branch.length * 7 + 8}
                  height="14"
                  rx="7"
                  fill="hsl(var(--muted))"
                  stroke="hsl(var(--border))"
                />
                <text
                  x={commit.x + 19}
                  y={commit.y + 3 + i * 16}
                  className="text-xs fill-muted-foreground font-medium"
                >
                  {branch}
                </text>
              </g>
            ))}
            
            {/* Commit message on hover */}
            <title>{`${commit.id}: ${commit.message}`}</title>
          </g>
        ))}
        
        {/* Timeline */}
        <text
          x={PADDING}
          y={actualHeight - 10}
          className="text-xs fill-muted-foreground"
        >
          ← older commits
        </text>
        <text
          x={actualWidth - PADDING - 100}
          y={actualHeight - 10}
          className="text-xs fill-muted-foreground"
        >
          newer commits →
        </text>
      </svg>
    </div>
  );
});

function computeLayout(state: RepoState) {
  const commits = Object.values(state.commits);
  const branches = Object.values(state.branches);
  
  // Sort commits topologically (parents before children)
  const sorted = topologicalSort(commits);
  const headCommitId = getHeadCommitId(state);
  
  // Assign colors to branches
  const branchColors = new Map<string, string>();
  branches.forEach((branch, i) => {
    branchColors.set(branch.name, BRANCH_COLORS[i % BRANCH_COLORS.length]);
  });
  
  // Assign positions
  const commitPositions = new Map<CommitID, { x: number; y: number; color: string }>();
  const branchTracks = new Map<string, number>(); // branch name -> y track
  let nextTrack = 0;
  
  // Position commits left to right (chronologically)
  sorted.forEach((commit, index) => {
    const x = PADDING + index * COMMIT_SPACING_X;
    
    // Determine which branch this commit belongs to
    const branchesAtCommit = branches.filter(b => b.tip === commit.id);
    const parentBranches = branches.filter(b => 
      commit.parents.some(p => isCommitOnBranch(state, p, b.name))
    );
    
    let track = 0;
    let color = BRANCH_COLORS[0];
    
    if (branchesAtCommit.length > 0) {
      // This is a branch tip
      const branch = branchesAtCommit[0];
      if (!branchTracks.has(branch.name)) {
        branchTracks.set(branch.name, nextTrack++);
      }
      track = branchTracks.get(branch.name)!;
      color = branchColors.get(branch.name) || BRANCH_COLORS[0];
    } else if (parentBranches.length > 0) {
      // Follow parent branch
      const parentBranch = parentBranches[0];
      if (!branchTracks.has(parentBranch.name)) {
        branchTracks.set(parentBranch.name, nextTrack++);
      }
      track = branchTracks.get(parentBranch.name)!;
      color = branchColors.get(parentBranch.name) || BRANCH_COLORS[0];
    } else {
      // Main line
      track = 0;
      color = BRANCH_COLORS[0];
    }
    
    const y = PADDING + track * BRANCH_SPACING_Y;
    
    commitPositions.set(commit.id, { x, y, color });
  });
  
  // Create layout objects
  const layoutCommits: LayoutCommit[] = sorted.map(commit => {
    const pos = commitPositions.get(commit.id)!;
    const isHead = commit.id === headCommitId;
    const branchLabels = branches
      .filter(b => b.tip === commit.id)
      .map(b => b.name);
    
    return {
      id: commit.id,
      x: pos.x,
      y: pos.y,
      color: pos.color,
      isHead,
      branchLabels,
      message: commit.message,
      parents: commit.parents,
    };
  });
  
  // Create connection paths
  const paths: LayoutPath[] = [];
  layoutCommits.forEach(commit => {
    commit.parents.forEach(parentId => {
      const parentPos = commitPositions.get(parentId);
      if (parentPos) {
        paths.push({
          from: { x: commit.x, y: commit.y },
          to: { x: parentPos.x, y: parentPos.y },
          color: commit.color,
        });
      }
    });
  });
  
  // Calculate dimensions
  const maxX = Math.max(...layoutCommits.map(c => c.x));
  const maxY = Math.max(...layoutCommits.map(c => c.y));
  
  return {
    commits: layoutCommits,
    paths,
    dimensions: {
      width: maxX + COMMIT_SPACING_X,
      height: maxY + BRANCH_SPACING_Y,
    },
  };
}

function topologicalSort(commits: Array<{id: CommitID; parents: CommitID[]}>) {
  const visited = new Set<CommitID>();
  const result: Array<{id: CommitID; parents: CommitID[]; message: string}> = [];
  const commitMap = new Map(commits.map(c => [c.id, c]));
  
  function visit(commitId: CommitID) {
    if (visited.has(commitId)) return;
    visited.add(commitId);
    
    const commit = commitMap.get(commitId);
    if (!commit) return;
    
    // Visit parents first
    commit.parents.forEach(parentId => {
      visit(parentId);
    });
    
    result.push(commit as any);
  }
  
  // Start from all commits that have no children (tips)
  const hasChildren = new Set<CommitID>();
  commits.forEach(commit => {
    commit.parents.forEach(parent => hasChildren.add(parent));
  });
  
  const tips = commits.filter(c => !hasChildren.has(c.id));
  tips.forEach(tip => visit(tip.id));
  
  // Visit any remaining commits
  commits.forEach(commit => visit(commit.id));
  
  return result;
}

function isCommitOnBranch(state: RepoState, commitId: CommitID, branchName: string): boolean {
  const branch = state.branches[branchName];
  if (!branch) return false;
  
  // Simple check: traverse from branch tip backwards
  const visited = new Set<CommitID>();
  const stack = [branch.tip];
  
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (visited.has(current)) continue;
    visited.add(current);
    
    if (current === commitId) return true;
    
    const commit = state.commits[current];
    if (commit) {
      stack.push(...commit.parents);
    }
  }
  
  return false;
}