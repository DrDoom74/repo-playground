import { RepoState, CommitID, Commit } from '../types';

export function stateToMermaidGitGraph(state: RepoState): string {
  if (!state.commits || Object.keys(state.commits).length === 0) {
    return 'gitGraph TB:\n    commit id: "empty"';
  }

  const commits = state.commits;
  const branches = state.branches;
  
  // Find the root commit (no parents)
  const rootCommits = Object.values(commits).filter(c => c.parents.length === 0);
  if (rootCommits.length === 0) return 'gitGraph TB:\n    commit id: "empty"';
  
  const rootCommit = rootCommits[0];
  
  // Topological sort to get commit order
  const sortedCommits = topologicalSort(commits, rootCommit.id);
  
  // Track which branch each commit belongs to
  const commitToBranch = new Map<CommitID, string>();
  
  // Find main branch (main or master or first branch)
  const mainBranchName = branches.main?.name || branches.master?.name || Object.keys(branches)[0] || 'main';
  
  // Assign commits to branches based on first-parent relationships
  assignCommitsToBranches(commits, branches, commitToBranch, mainBranchName);
  
  let mermaidCode = 'gitGraph TB:\n';
  const createdBranches = new Set<string>();
  let currentBranch = mainBranchName;
  
  for (const commitId of sortedCommits) {
    const commit = commits[commitId];
    const branchName = commitToBranch.get(commitId) || mainBranchName;
    
    // Create branch if needed
    if (!createdBranches.has(branchName) && branchName !== mainBranchName) {
      mermaidCode += `    branch ${branchName}\n`;
      createdBranches.add(branchName);
    }
    
    // Switch to branch if needed
    if (currentBranch !== branchName) {
      mermaidCode += `    checkout ${branchName}\n`;
      currentBranch = branchName;
    }
    
    // Handle merge commits
    if (commit.parents.length === 2) {
      const firstParent = commit.parents[0];
      const secondParent = commit.parents[1];
      const firstParentBranch = commitToBranch.get(firstParent) || mainBranchName;
      const secondParentBranch = commitToBranch.get(secondParent) || mainBranchName;
      
      if (firstParentBranch !== secondParentBranch) {
        mermaidCode += `    checkout ${firstParentBranch}\n`;
        mermaidCode += `    merge ${secondParentBranch}\n`;
        currentBranch = firstParentBranch;
        continue;
      }
    }
    
    // Regular commit
    const message = commit.message.length > 20 ? 
      commit.message.substring(0, 17) + '...' : 
      commit.message;
    mermaidCode += `    commit id: "${commitId}"\n`;
  }
  
  return mermaidCode;
}

function topologicalSort(commits: Record<CommitID, Commit>, rootId: CommitID): CommitID[] {
  const visited = new Set<CommitID>();
  const result: CommitID[] = [];
  
  function visit(commitId: CommitID) {
    if (visited.has(commitId)) return;
    visited.add(commitId);
    
    const commit = commits[commitId];
    if (!commit) return;
    
    // Visit children first (commits that have this as parent)
    Object.values(commits).forEach(c => {
      if (c.parents.includes(commitId)) {
        visit(c.id);
      }
    });
    
    result.unshift(commitId);
  }
  
  visit(rootId);
  return result;
}

function assignCommitsToBranches(
  commits: Record<CommitID, Commit>,
  branches: Record<string, any>,
  commitToBranch: Map<CommitID, string>,
  mainBranchName: string
) {
  // Start with branch tips
  Object.entries(branches).forEach(([branchName, branch]) => {
    let currentCommit = branch.tip;
    const visited = new Set<CommitID>();
    
    while (currentCommit && !visited.has(currentCommit)) {
      visited.add(currentCommit);
      
      if (!commitToBranch.has(currentCommit)) {
        commitToBranch.set(currentCommit, branchName);
      }
      
      const commit = commits[currentCommit];
      if (!commit || commit.parents.length === 0) break;
      
      // Follow first parent for linear history
      currentCommit = commit.parents[0];
    }
  });
  
  // Assign remaining commits to main branch
  Object.keys(commits).forEach(commitId => {
    if (!commitToBranch.has(commitId)) {
      commitToBranch.set(commitId, mainBranchName);
    }
  });
}