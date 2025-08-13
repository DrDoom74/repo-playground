import { create } from 'zustand';
import { RepoState, Head, Commit, ActionLogItem } from '@/git/types';
import { computeLCA, genNewId, getHeadCommitId, isAncestor } from '@/git/utils';

interface GitStoreState {
  repo: RepoState;
  logs: ActionLogItem[];
  setRepo: (repo: RepoState) => void;
  reset: (repo: RepoState) => void;
  checkout: (ref: string) => void;
  createBranch: (name: string, fromRef?: string) => void;
  commit: (message: string) => void;
  merge: (fromBranch: string) => void;
  rebase: (ontoBranch: string) => void;
  resetHard: (toCommit: string) => void;
  cherryPick: (commitId: string) => void;
}

const emptyRepo: RepoState = {
  commits: {
    A: { id: 'A', parents: [], message: 'init' },
  },
  branches: {
    main: { name: 'main', tip: 'A' },
  },
  head: { type: 'branch', ref: 'main' },
};

function log(state: GitStoreState, op: ActionLogItem['op'], message: string) {
  state.logs.unshift({ ts: Date.now(), op, message });
}

export const useGitStore = create<GitStoreState>((set, get) => ({
  repo: emptyRepo,
  logs: [],
  setRepo: (repo) => set({ repo }),
  reset: (repo) => set({ repo, logs: [] }),

  checkout: (ref: string) => {
    const state = get();
    const repo = structuredClone(state.repo);
    if (repo.branches[ref]) {
      repo.head = { type: 'branch', ref } satisfies Head;
      set({ repo });
      log(get(), 'checkout', `checkout ${ref}`);
      return;
    }
    if (repo.commits[ref]) {
      repo.head = { type: 'detached', ref };
      set({ repo });
      log(get(), 'checkout', `checkout ${ref} (detached)`);
      return;
    }
    log(get(), 'error', `Ref not found: ${ref}`);
  },

  createBranch: (name: string, fromRef?: string) => {
    const state = get();
    const repo = structuredClone(state.repo);
    if (repo.branches[name]) {
      log(get(), 'error', `Branch ${name} already exists`);
      return;
    }
    let fromCommit: string | undefined;
    if (fromRef) {
      if (repo.branches[fromRef]) fromCommit = repo.branches[fromRef].tip;
      else if (repo.commits[fromRef]) fromCommit = fromRef;
    } else {
      fromCommit = getHeadCommitId(repo);
    }
    if (!fromCommit) {
      log(get(), 'error', `Invalid from ref`);
      return;
    }
    repo.branches[name] = { name, tip: fromCommit };
    set({ repo });
    log(get(), 'branch.create', `branch ${name} @ ${fromCommit}`);
  },

  commit: (message: string) => {
    const state = get();
    const repo = structuredClone(state.repo);
    const parent = getHeadCommitId(repo);
    const id = genNewId('C');
    const commit: Commit = { id, parents: [parent], message };
    repo.commits[id] = commit;
    if (repo.head.type === 'branch') {
      repo.branches[repo.head.ref].tip = id;
    } else {
      repo.head = { type: 'detached', ref: id };
    }
    set({ repo });
    log(get(), 'commit', `commit ${id}: ${message}`);
  },

  merge: (fromBranch: string) => {
    const state = get();
    const repo = structuredClone(state.repo);
    if (repo.head.type !== 'branch') {
      log(get(), 'error', 'Merge requires HEAD at a branch');
      return;
    }
    const targetBranch = repo.head.ref;
    const targetTip = repo.branches[targetBranch].tip;
    const fromTip = repo.branches[fromBranch]?.tip;
    if (!fromTip) {
      log(get(), 'error', `Branch not found: ${fromBranch}`);
      return;
    }
    if (isAncestor(repo.commits, targetTip, fromTip)) {
      // Fast-forward
      repo.branches[targetBranch].tip = fromTip;
      set({ repo });
      log(get(), 'merge', `fast-forward ${fromBranch} -> ${targetBranch}`);
      return;
    }
    // Create merge commit
    const id = genNewId('M');
    repo.commits[id] = { id, parents: [targetTip, fromTip], message: `merge ${fromBranch} into ${targetBranch}` };
    repo.branches[targetBranch].tip = id;
    set({ repo });
    log(get(), 'merge', `merge ${fromBranch} into ${targetBranch} as ${id}`);
  },

  rebase: (ontoBranch: string) => {
    const state = get();
    const repo = structuredClone(state.repo);
    if (repo.head.type !== 'branch') {
      log(get(), 'error', 'Rebase requires HEAD at a branch');
      return;
    }
    const curBranch = repo.head.ref;
    const ontoTip = repo.branches[ontoBranch]?.tip;
    const curTip = repo.branches[curBranch].tip;
    if (!ontoTip) {
      log(get(), 'error', `Branch not found: ${ontoBranch}`);
      return;
    }
    const lca = computeLCA(repo.commits, curTip, ontoTip);
    if (!lca) {
      log(get(), 'error', 'No common ancestor');
      return;
    }
    // collect chain from curTip back to (but excluding) lca along first-parent
    const chain: string[] = [];
    let cursor = curTip;
    while (cursor && cursor !== lca) {
      chain.unshift(cursor);
      const parents = repo.commits[cursor]?.parents || [];
      cursor = parents[0];
      if (!cursor) break;
    }
    let base = ontoTip;
    for (const oldId of chain) {
      const old = repo.commits[oldId];
      const newId = genNewId('R');
      repo.commits[newId] = { id: newId, parents: [base], message: old.message };
      base = newId;
    }
    repo.branches[curBranch].tip = base;
    set({ repo });
    log(get(), 'rebase', `rebase ${curBranch} onto ${ontoBranch}`);
  },

  resetHard: (toCommit: string) => {
    const state = get();
    const repo = structuredClone(state.repo);
    if (repo.head.type === 'branch') {
      if (!repo.commits[toCommit]) {
        log(get(), 'error', `Commit not found: ${toCommit}`);
        return;
      }
      repo.branches[repo.head.ref].tip = toCommit;
      set({ repo });
      log(get(), 'reset.hard', `reset --hard ${toCommit}`);
      return;
    }
    // detached: move head only
    if (!repo.commits[toCommit]) {
      log(get(), 'error', `Commit not found: ${toCommit}`);
      return;
    }
    repo.head = { type: 'detached', ref: toCommit };
    set({ repo });
    log(get(), 'reset.hard', `detached reset to ${toCommit}`);
  },

  cherryPick: (commitId: string) => {
    const state = get();
    const repo = structuredClone(state.repo);
    const source = repo.commits[commitId];
    if (!source) {
      log(get(), 'error', `Commit not found: ${commitId}`);
      return;
    }
    const parent = getHeadCommitId(repo);
    const id = genNewId('P');
    repo.commits[id] = { id, parents: [parent], message: `cherry-pick: ${source.message}` };
    if (repo.head.type === 'branch') {
      repo.branches[repo.head.ref].tip = id;
    } else {
      repo.head = { type: 'detached', ref: id };
    }
    set({ repo });
    log(get(), 'cherry-pick', `cherry-pick ${commitId} -> ${id}`);
  },
}));
