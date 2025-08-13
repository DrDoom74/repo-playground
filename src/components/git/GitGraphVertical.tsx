import { memo, useMemo } from 'react';
import { RepoState, CommitID } from '@/git/types';
import { getHeadCommitId } from '@/git/utils';

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
  branchLabels: string[];
  message: string;
  parents: CommitID[];
  lane: number;
}

interface LayoutPath {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
  curved?: boolean;
}

const COMMIT_RADIUS = 6;
const COMMIT_SPACING_Y = 40;
const LANE_WIDTH = 30;
const PADDING = 40;

const BRANCH_COLORS = [
  'hsl(var(--primary))',
  'hsl(145, 60%, 50%)', // green  
  'hsl(340, 75%, 60%)', // pink
  'hsl(25, 85%, 60%)',  // orange
  'hsl(260, 70%, 65%)', // purple
  'hsl(190, 70%, 55%)', // cyan
];

export const GitGraphVertical = memo(({ state, height = 400, width = 400 }: GitGraphVerticalProps) => {
  const { commits: layoutCommits, paths, dimensions } = useMemo(() => {
    return computeVerticalLayout(state);
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
        
        {/* Connection paths */}
        {paths.map((path, i) => (
          <g key={i}>
            {path.curved ? (
              <path
                d={`M ${path.from.x},${path.from.y} Q ${(path.from.x + path.to.x) / 2},${path.from.y + 20} ${path.to.x},${path.to.y}`}
                stroke={path.color}
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
            ) : (
              <line
                x1={path.from.x}
                y1={path.from.y}
                x2={path.to.x}
                y2={path.to.y}
                stroke={path.color}
                strokeWidth="2"
                strokeLinecap="round"
              />
            )}
          </g>
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
              stroke="hsl(var(--card-foreground))"
              strokeWidth={commit.isHead ? 2 : 1}
              className="transition-all duration-200"
            />
            
            {/* Commit ID */}
            <text
              x={commit.x + COMMIT_RADIUS + 8}
              y={commit.y + 4}
              className="text-sm font-mono font-semibold fill-foreground"
            >
              {commit.id}
            </text>
            
            {/* Commit message */}
            <text
              x={commit.x + COMMIT_RADIUS + 8}
              y={commit.y + 18}
              className="text-xs fill-muted-foreground"
            >
              {commit.message.length > 30 ? commit.message.slice(0, 30) + '...' : commit.message}
            </text>
            
            {/* HEAD indicator */}
            {commit.isHead && (
              <text
                x={commit.x - 30}
                y={commit.y + 4}
                className="text-xs font-bold fill-primary"
              >
                HEAD
              </text>
            )}
            
            {/* Branch labels */}
            {commit.branchLabels.map((branch, i) => (
              <g key={branch}>
                <rect
                  x={commit.x + COMMIT_RADIUS + 8}
                  y={commit.y + 24 + i * 16}
                  width={branch.length * 6 + 8}
                  height="14"
                  rx="7"
                  fill="hsl(var(--primary))"
                  stroke="hsl(var(--border))"
                />
                <text
                  x={commit.x + COMMIT_RADIUS + 12}
                  y={commit.y + 35 + i * 16}
                  className="text-xs fill-primary-foreground font-medium"
                >
                  {branch}
                </text>
              </g>
            ))}
            
            {/* Commit details on hover */}
            <title>{`${commit.id}: ${commit.message}`}</title>
          </g>
        ))}
        
        {/* Git graph style indicators */}
        <text
          x={PADDING}
          y={30}
          className="text-xs fill-muted-foreground font-mono"
        >
          * commit graph (newest first)
        </text>
      </svg>
    </div>
  );
});

function computeVerticalLayout(state: RepoState) {
  const commits = Object.values(state.commits);
  const branches = Object.values(state.branches);
  
  // Build commit graph structure
  const commitMap = new Map(commits.map(c => [c.id, c]));
  const children = new Map<CommitID, CommitID[]>();
  
  commits.forEach(commit => {
    commit.parents.forEach(parentId => {
      if (!children.has(parentId)) children.set(parentId, []);
      children.get(parentId)!.push(commit.id);
    });
  });
  
  // Find all branch tips and sort by recency (newest first)
  const tips = branches.map(b => b.tip);
  const sorted = topologicalSortVertical(commits, tips);
  
  const headCommitId = getHeadCommitId(state);
  
  // Assign lanes (columns) to commits
  const commitLanes = new Map<CommitID, number>();
  const laneBranches = new Map<number, string>();
  let nextLane = 0;
  
  // Assign colors to branches
  const branchColors = new Map<string, string>();
  branches.forEach((branch, i) => {
    branchColors.set(branch.name, BRANCH_COLORS[i % BRANCH_COLORS.length]);
  });
  
  // Process commits from newest to oldest
  sorted.forEach((commit, index) => {
    const y = PADDING + index * COMMIT_SPACING_Y;
    
    // Determine which branch this commit belongs to
    const branchesAtCommit = branches.filter(b => b.tip === commit.id);
    let lane = 0;
    let color = BRANCH_COLORS[0];
    
    if (branchesAtCommit.length > 0) {
      // This is a branch tip - assign new lane if needed
      const branch = branchesAtCommit[0];
      lane = nextLane++;
      laneBranches.set(lane, branch.name);
      color = branchColors.get(branch.name) || BRANCH_COLORS[0];
    } else {
      // Follow parent's lane or create new one
      const parentCommits = commit.parents.map(p => commitMap.get(p)).filter(Boolean);
      if (parentCommits.length > 0) {
        const parentLane = commitLanes.get(parentCommits[0]!.id);
        if (parentLane !== undefined) {
          lane = parentLane;
          const branchName = laneBranches.get(lane);
          color = branchName ? branchColors.get(branchName) || BRANCH_COLORS[0] : BRANCH_COLORS[lane % BRANCH_COLORS.length];
        } else {
          lane = nextLane++;
        }
      } else {
        lane = nextLane++;
      }
    }
    
    commitLanes.set(commit.id, lane);
    const x = PADDING + lane * LANE_WIDTH;
    
    const isHead = commit.id === headCommitId;
    const branchLabels = branches
      .filter(b => b.tip === commit.id)
      .map(b => b.name);
    
    const layoutCommit: LayoutCommit = {
      id: commit.id,
      x,
      y,
      color,
      isHead,
      branchLabels,
      message: commit.message,
      parents: commit.parents,
      lane,
    };
  });
  
  // Create layout objects
  const layoutCommits: LayoutCommit[] = sorted.map((commit, index) => {
    const lane = commitLanes.get(commit.id) || 0;
    const x = PADDING + lane * LANE_WIDTH;
    const y = PADDING + index * COMMIT_SPACING_Y;
    const isHead = commit.id === headCommitId;
    const branchLabels = branches
      .filter(b => b.tip === commit.id)
      .map(b => b.name);
    
    const branchName = laneBranches.get(lane) || 'main';
    const color = branchColors.get(branchName) || BRANCH_COLORS[lane % BRANCH_COLORS.length];
    
    return {
      id: commit.id,
      x,
      y,
      color,
      isHead,
      branchLabels,
      message: commit.message,
      parents: commit.parents,
      lane,
    };
  });
  
  // Create connection paths
  const paths: LayoutPath[] = [];
  layoutCommits.forEach(commit => {
    commit.parents.forEach(parentId => {
      const parentCommit = layoutCommits.find(c => c.id === parentId);
      if (parentCommit) {
        const curved = commit.lane !== parentCommit.lane;
        paths.push({
          from: { x: commit.x, y: commit.y },
          to: { x: parentCommit.x, y: parentCommit.y },
          color: commit.color,
          curved,
        });
      }
    });
  });
  
  // Calculate dimensions
  const maxX = Math.max(...layoutCommits.map(c => c.x), PADDING);
  const maxY = Math.max(...layoutCommits.map(c => c.y), PADDING);
  
  return {
    commits: layoutCommits,
    paths,
    dimensions: {
      width: maxX + LANE_WIDTH + 200, // Extra space for text
      height: maxY + COMMIT_SPACING_Y,
    },
  };
}

function topologicalSortVertical(commits: Array<{id: CommitID; parents: CommitID[]}>, tips: CommitID[]) {
  const visited = new Set<CommitID>();
  const result: Array<{id: CommitID; parents: CommitID[]; message: string}> = [];
  const commitMap = new Map(commits.map(c => [c.id, c]));
  
  function visit(commitId: CommitID) {
    if (visited.has(commitId)) return;
    visited.add(commitId);
    
    const commit = commitMap.get(commitId);
    if (!commit) return;
    
    result.push(commit as any);
    
    // Visit parents after adding current (reverse topological order for newest first)
    commit.parents.forEach(parentId => {
      visit(parentId);
    });
  }
  
  // Start from tips (newest commits)
  tips.forEach(tip => visit(tip));
  
  // Visit any remaining commits
  commits.forEach(commit => visit(commit.id));
  
  return result;
}