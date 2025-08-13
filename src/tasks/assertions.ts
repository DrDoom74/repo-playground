import { RepoState, Assertion } from '@/git/types';
import { branchContainsCommits, computeLCA, getBranchTip, getHeadCommitId, hasMergeCommitOnBranch, isAncestor, isLinearHistory } from '@/git/utils';

export interface AssertionResult {
  allPassed: boolean;
  details: { assertion: Assertion; passed: boolean; note?: string }[];
}

export function checkAssertion(state: RepoState, assertion: Assertion): boolean {
  return check(state, assertion);
}

export function evaluateAssertions(state: RepoState, assertions: Assertion[]): AssertionResult {
  const details: AssertionResult['details'] = assertions.map((a) => ({ assertion: a, passed: check(state, a) }));
  return { allPassed: details.every((d) => d.passed), details };
}

function check(state: RepoState, a: Assertion): boolean {
  switch (a.type) {
    case 'HEAD_AT_BRANCH':
      return state.head.type === 'branch' && state.head.ref === a.branch;
    case 'BRANCH_AT_COMMIT': {
      const tip = getBranchTip(state, a.branch);
      return tip === a.commit;
    }
    case 'IS_FAST_FORWARD': {
      const target = getBranchTip(state, a.targetBranch);
      const from = getBranchTip(state, a.fromBranch);
      if (!target || !from) return false;
      return isAncestor(state.commits, target, from);
    }
    case 'HAS_MERGE_COMMIT_ON_BRANCH':
      return hasMergeCommitOnBranch(state, a.branch);
    case 'BRANCH_CONTAINS_COMMITS':
      return branchContainsCommits(state, a.branch, a.commits);
    case 'LINEAR_HISTORY':
      return isLinearHistory(state, a.branch);
    case 'HEAD_AT_COMMIT':
      return state.head.type === 'detached' ? state.head.ref === a.commit : getHeadCommitId(state) === a.commit;
    case 'COMMIT_COUNT_ON_BRANCH': {
      const tip = getBranchTip(state, a.branch);
      if (!tip) return false;
      // naive: count unique ancestors
      const visited = new Set<string>();
      const stack = [tip];
      while (stack.length) {
        const id = stack.pop()!;
        if (visited.has(id)) continue;
        visited.add(id);
        for (const p of state.commits[id]?.parents || []) stack.push(p);
      }
      if (a.eq !== undefined) return visited.size === a.eq;
      if (a.gte !== undefined) return visited.size >= a.gte;
      return true;
    }
    case 'BRANCH_EXISTS':
      return a.exists ? !!state.branches[a.branch] : !state.branches[a.branch];
    case 'EITHER':
      return a.anyOf.some((x) => check(state, x));
    
    case 'HEAD_IS_DETACHED':
      return state.head.type === 'detached';
    
    case 'COMMIT_MESSAGE_CONTAINS':
      const commit = state.commits[a.commit];
      return commit ? commit.message.includes(a.text) : false;
    
    case 'NO_MERGE_COMMITS_ON_BRANCH':
      const tip = getBranchTip(state, a.branch);
      if (!tip) return false;
      const tipCommit = state.commits[tip];
      return tipCommit ? tipCommit.parents.length <= 1 : false;
    
    case 'BRANCH_REBASED_ONTO':
      // Check if branch was rebased onto target by looking for linear history
      // and that the base is reachable from the onto branch
      const branchTip = getBranchTip(state, a.branch);
      const ontoTip = getBranchTip(state, a.onto);
      if (!branchTip || !ontoTip) return false;
      
      // Check if it's linear from branch tip to onto tip
      return isLinearHistory(state, a.branch) && 
             isAncestor(state.commits, ontoTip, branchTip);
    
    default:
      return false;
  }
}
