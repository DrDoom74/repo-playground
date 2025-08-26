import { RepoState, CommitID, Commit } from '../types';

export function stateToMermaidGitGraph(state: RepoState, direction: 'TB' | 'LR' | 'RL' = 'TB'): string {
  // Sanitize direction - gitGraph only supports TB and LR
  const sanitizedDirection = direction === 'RL' ? 'LR' : direction;
  
  if (!state.commits || Object.keys(state.commits).length === 0) {
    return `gitGraph ${sanitizedDirection}:\n    commit id: "empty"`;
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
  
  let mermaidCode = `gitGraph ${sanitizedDirection}:\n`;
  const createdBranches = new Set<string>();
  let currentBranch = mainBranchName;
  createdBranches.add(mainBranchName);
  
  for (const commitId of sortedCommits) {
    const commit = commits[commitId];
    const branchName = commitToBranch.get(commitId) || mainBranchName;
    
    // Create branch if needed
    if (!createdBranches.has(branchName) && branchName !== mainBranchName) {
      // Ensure we're on the base branch before creating new branch
      if (currentBranch !== mainBranchName) {
        mermaidCode += `    checkout ${mainBranchName}\n`;
        currentBranch = mainBranchName;
      }
      mermaidCode += `    branch ${branchName}\n`;
      createdBranches.add(branchName);
      currentBranch = branchName;
    } else if (currentBranch !== branchName) {
      // Switch to branch if needed (avoid redundant checkouts)
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
        // Ensure we're on the target branch before merging
        if (currentBranch !== firstParentBranch) {
          mermaidCode += `    checkout ${firstParentBranch}\n`;
          currentBranch = firstParentBranch;
        }
        mermaidCode += `    merge ${secondParentBranch}\n`;
        // Update the commit-to-branch mapping for the merge commit
        commitToBranch.set(commitId, firstParentBranch);
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
  const inDegree = new Map<CommitID, number>();
  const children = new Map<CommitID, CommitID[]>();
  
  // Initialize in-degree and children maps
  Object.values(commits).forEach(commit => {
    inDegree.set(commit.id, commit.parents.length);
    commit.parents.forEach(parentId => {
      if (!children.has(parentId)) {
        children.set(parentId, []);
      }
      children.get(parentId)!.push(commit.id);
    });
  });
  
  // Kahn's algorithm for proper topological sort
  const queue: CommitID[] = [];
  const result: CommitID[] = [];
  
  // Start with nodes that have no incoming edges (roots)
  inDegree.forEach((degree, commitId) => {
    if (degree === 0) {
      queue.push(commitId);
    }
  });
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);
    
    const commitChildren = children.get(current) || [];
    commitChildren.forEach(child => {
      const newDegree = inDegree.get(child)! - 1;
      inDegree.set(child, newDegree);
      if (newDegree === 0) {
        queue.push(child);
      }
    });
  }
  
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