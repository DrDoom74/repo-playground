import { CommitID, RepoState } from "./types";

export function getHeadCommitId(state: RepoState): CommitID {
  if (state.head.type === 'branch') {
    const br = state.branches[state.head.ref];
    return br.tip;
  }
  return state.head.ref;
}

export function getBranchTip(state: RepoState, branch: string): CommitID | undefined {
  return state.branches[branch]?.tip;
}

export function isAncestor(commits: Record<CommitID, any>, ancestor: CommitID, descendant: CommitID): boolean {
  if (ancestor === descendant) return true;
  const visited = new Set<CommitID>();
  const stack: CommitID[] = [descendant];
  while (stack.length) {
    const id = stack.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const parents = commits[id]?.parents || [];
    for (const p of parents) {
      if (p === ancestor) return true;
      stack.push(p);
    }
  }
  return false;
}

export function computeLCA(commits: Record<CommitID, any>, a: CommitID, b: CommitID): CommitID | null {
  const ancestorsA = new Set<CommitID>();
  const stackA: CommitID[] = [a];
  while (stackA.length) {
    const id = stackA.pop()!;
    if (ancestorsA.has(id)) continue;
    ancestorsA.add(id);
    for (const p of commits[id]?.parents || []) stackA.push(p);
  }
  const stackB: CommitID[] = [b];
  const visitedB = new Set<CommitID>();
  while (stackB.length) {
    const id = stackB.pop()!;
    if (visitedB.has(id)) continue;
    visitedB.add(id);
    if (ancestorsA.has(id)) return id;
    for (const p of commits[id]?.parents || []) stackB.push(p);
  }
  return null;
}

export function linearChainFrom(state: RepoState, tip: CommitID): CommitID[] {
  const chain: CommitID[] = [];
  let cur: CommitID | undefined = tip;
  const seen = new Set<CommitID>();
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    chain.push(cur);
    const parents = state.commits[cur]?.parents || [];
    if (parents.length === 1) cur = parents[0];
    else if (parents.length === 0) break;
    else {
      // merge commit in chain; keep following first parent for visualization
      cur = parents[0];
    }
  }
  return chain;
}

export function hasMergeCommitOnBranch(state: RepoState, branch: string): boolean {
  const tip = getBranchTip(state, branch);
  if (!tip) return false;
  return (state.commits[tip]?.parents?.length || 0) === 2;
}

export function branchContainsCommits(state: RepoState, branch: string, commits: CommitID[]): boolean {
  const tip = getBranchTip(state, branch);
  if (!tip) return false;
  const visited = new Set<CommitID>();
  const stack: CommitID[] = [tip];
  const needed = new Set(commits.map((c) => c.replace("*", "")));
  while (stack.length) {
    const id = stack.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);
    if (needed.has(id) || matchWildcard(id, needed)) {
      // keep searching, we don't early exit to verify all
    }
    for (const p of state.commits[id]?.parents || []) stack.push(p);
  }
  // all needed must be found exactly or by wildcard matcher
  for (const n of needed) {
    if (![...visited].some((v) => v === n || wildcardEq(v, n))) return false;
  }
  return true;
}

function matchWildcard(id: string, needed: Set<string>): boolean {
  return [...needed].some((n) => wildcardEq(id, n));
}

function wildcardEq(id: string, pattern: string): boolean {
  // pattern may be like "C" without star; handled upstream
  // We treat pattern like raw id; here for completeness
  return id === pattern;
}

export function isLinearHistory(state: RepoState, branch: string): boolean {
  const tip = state.branches[branch]?.tip;
  if (!tip) return false;
  // Linear if no merge commit at tip and along the first-parent chain we don't require branching on current line
  return (state.commits[tip]?.parents.length || 0) <= 1;
}

let idCounter = 0;
export function genNewId(base: string = 'X'): string {
  idCounter += 1;
  return `${base}${idCounter}`;
}
