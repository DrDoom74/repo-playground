import { RepoState, ActionLogItem } from '@/git/types';
import { getHeadCommitId, linearChainFrom } from '@/git/utils';

export function formatStatus(state: RepoState): string {
  const headCommit = getHeadCommitId(state);
  const currentBranch = state.head.type === 'branch' ? state.head.ref : null;
  
  let output = '';
  
  if (currentBranch) {
    output += `On branch ${currentBranch}\n`;
  } else {
    output += `HEAD detached at ${headCommit}\n`;
  }
  
  output += `HEAD: ${headCommit}\n`;
  output += `Commit: ${state.commits[headCommit]?.message || 'unknown'}\n`;
  
  // Show if this is ahead/behind other branches
  const otherBranches = Object.values(state.branches).filter(b => b.name !== currentBranch);
  if (otherBranches.length > 0 && currentBranch) {
    output += '\nBranch status:\n';
    for (const branch of otherBranches) {
      const relation = getBranchRelation(state, currentBranch, branch.name);
      if (relation) {
        output += `  ${branch.name}: ${relation}\n`;
      }
    }
  }
  
  return output.trim();
}

export function formatBranches(state: RepoState, showAll: boolean = false): string {
  const branches = Object.values(state.branches);
  const currentBranch = state.head.type === 'branch' ? state.head.ref : null;
  
  let output = '';
  
  for (const branch of branches) {
    const isActive = branch.name === currentBranch;
    const prefix = isActive ? '* ' : '  ';
    const commit = state.commits[branch.tip];
    const message = commit ? commit.message : 'unknown';
    
    output += `${prefix}${branch.name} ${branch.tip} ${message}\n`;
  }
  
  if (state.head.type === 'detached') {
    output += `* (HEAD detached at ${state.head.ref})\n`;
  }
  
  return output.trim();
}

export function formatLog(state: RepoState, oneline: boolean = false): string {
  const headCommit = getHeadCommitId(state);
  const chain = linearChainFrom(state, headCommit);
  
  let output = '';
  
  for (const commitId of chain) {
    const commit = state.commits[commitId];
    if (!commit) continue;
    
    if (oneline) {
      output += `${commitId} ${commit.message}\n`;
    } else {
      output += `commit ${commitId}\n`;
      if (commit.parents.length > 1) {
        output += `Merge: ${commit.parents.join(' ')}\n`;
      }
      output += `\n    ${commit.message}\n\n`;
    }
  }
  
  return output.trim();
}

export function formatShow(state: RepoState, commitId?: string): string {
  const targetCommit = commitId || getHeadCommitId(state);
  const commit = state.commits[targetCommit];
  
  if (!commit) {
    return `fatal: bad object ${targetCommit}`;
  }
  
  let output = `commit ${targetCommit}\n`;
  
  if (commit.parents.length > 1) {
    output += `Merge: ${commit.parents.join(' ')}\n`;
  }
  
  output += `\n    ${commit.message}\n`;
  
  if (commit.parents.length > 0) {
    output += `\nParents: ${commit.parents.join(', ')}\n`;
  }
  
  return output.trim();
}

export function formatReflog(logs: ActionLogItem[]): string {
  if (logs.length === 0) {
    return 'No reflog entries';
  }
  
  let output = '';
  
  for (let i = logs.length - 1; i >= Math.max(0, logs.length - 10); i--) {
    const log = logs[i];
    const date = new Date(log.ts).toLocaleString();
    output += `${date} ${log.op}: ${log.message}\n`;
  }
  
  return output.trim();
}

function getBranchRelation(state: RepoState, branch1: string, branch2: string): string | null {
  const b1 = state.branches[branch1];
  const b2 = state.branches[branch2];
  
  if (!b1 || !b2) return null;
  
  if (b1.tip === b2.tip) {
    return 'up to date';
  }
  
  // Simple check - in a real implementation you'd do proper ancestry checking
  const chain1 = linearChainFrom(state, b1.tip);
  const chain2 = linearChainFrom(state, b2.tip);
  
  if (chain1.includes(b2.tip)) {
    return `ahead by ${chain1.indexOf(b2.tip)} commits`;
  } else if (chain2.includes(b1.tip)) {
    return `behind by ${chain2.indexOf(b1.tip)} commits`;
  }
  
  return 'diverged';
}