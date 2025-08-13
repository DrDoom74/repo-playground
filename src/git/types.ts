export type CommitID = string;

export interface Commit {
  id: CommitID;
  parents: CommitID[]; // 1 for normal commit, 2 for merge
  message: string;
}

export interface Branch {
  name: string;
  tip: CommitID;
}

export type Head =
  | { type: 'branch'; ref: string }
  | { type: 'detached'; ref: CommitID };

export interface RepoState {
  commits: Record<CommitID, Commit>;
  branches: Record<string, Branch>;
  head: Head;
}

export type OperationName =
  | 'checkout'
  | 'branch.create'
  | 'commit'
  | 'merge'
  | 'rebase'
  | 'reset.hard'
  | 'cherry-pick';

export interface ActionLogItem {
  ts: number;
  op: OperationName | 'system' | 'info' | 'error';
  message: string;
}

export type Assertion =
  | { type: 'HEAD_AT_BRANCH'; branch: string }
  | { type: 'BRANCH_AT_COMMIT'; branch: string; commit: CommitID }
  | { type: 'IS_FAST_FORWARD'; targetBranch: string; fromBranch: string }
  | { type: 'HAS_MERGE_COMMIT_ON_BRANCH'; branch: string }
  | { type: 'BRANCH_CONTAINS_COMMITS'; branch: string; commits: CommitID[] }
  | { type: 'LINEAR_HISTORY'; branch: string }
  | { type: 'HEAD_AT_COMMIT'; commit: CommitID }
  | { type: 'COMMIT_COUNT_ON_BRANCH'; branch: string; gte?: number; eq?: number }
  | { type: 'BRANCH_EXISTS'; branch: string; exists: boolean }
  | { type: 'EITHER'; anyOf: Assertion[] };

export interface Task {
  id: string;
  title: string;
  level: 'basic' | 'intermediate' | 'advanced';
  description: string;
  initial: RepoState;
  allowedOps?: OperationName[];
  target: Assertion[];
  hint: string;
  explanation: string;
  maxScore: number;
}
