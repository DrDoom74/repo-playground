import { Task } from '@/git/types';

export const tasks: Task[] = [
  {
    id: 'T01',
    title: 'Переключение ветки',
    level: 'basic',
    description: 'Переключись на ветку feature.',
    initial: {
      commits: {
        A: { id: 'A', parents: [], message: 'init' },
        B: { id: 'B', parents: ['A'], message: 'B' },
      },
      branches: {
        main: { name: 'main', tip: 'B' },
        feature: { name: 'feature', tip: 'A' },
      },
      head: { type: 'branch', ref: 'main' },
    },
    allowedOps: ['checkout'],
    target: [{ type: 'HEAD_AT_BRANCH', branch: 'feature' }],
    hint: 'Checkout — это перемещение HEAD на ветку или коммит.',
    explanation: 'git checkout feature — HEAD указывает на ветку feature.',
    maxScore: 8,
  },
  {
    id: 'T02',
    title: 'Создай ветку от текущего коммита',
    level: 'basic',
    description: 'Создай ветку hotfix от текущего коммита.',
    initial: {
      commits: {
        A: { id: 'A', parents: [], message: 'init' },
        B: { id: 'B', parents: ['A'], message: 'B' },
      },
      branches: {
        main: { name: 'main', tip: 'B' },
      },
      head: { type: 'branch', ref: 'main' },
    },
    allowedOps: ['branch.create', 'checkout'],
    target: [
      { type: 'BRANCH_EXISTS', branch: 'hotfix', exists: true },
      { type: 'BRANCH_AT_COMMIT', branch: 'hotfix', commit: 'B' },
    ],
    hint: 'Новая ветка — это новый указатель на коммит.',
    explanation: 'git branch hotfix — создаёт ветку, не двигая HEAD.',
    maxScore: 8,
  },
  {
    id: 'T03',
    title: 'Fast-forward merge',
    level: 'basic',
    description: 'Слей feature в main fast-forward.',
    initial: {
      commits: {
        A: { id: 'A', parents: [], message: 'init' },
        B: { id: 'B', parents: ['A'], message: 'B' },
        C: { id: 'C', parents: ['B'], message: 'C' },
      },
      branches: {
        main: { name: 'main', tip: 'B' },
        feature: { name: 'feature', tip: 'C' },
      },
      head: { type: 'branch', ref: 'main' },
    },
    allowedOps: ['merge', 'checkout'],
    target: [
      { type: 'IS_FAST_FORWARD', targetBranch: 'main', fromBranch: 'feature' },
      { type: 'BRANCH_AT_COMMIT', branch: 'main', commit: 'C' },
      { type: 'LINEAR_HISTORY', branch: 'main' },
    ],
    hint: 'FF возможен, если main — предок feature.',
    explanation: 'git merge feature передвинет main на C без merge-коммита.',
    maxScore: 10,
  },
  {
    id: 'T04',
    title: 'Merge с merge-коммитом',
    level: 'basic',
    description: 'Слей feature в main с merge-коммитом.',
    initial: {
      commits: {
        A: { id: 'A', parents: [], message: 'init' },
        B: { id: 'B', parents: ['A'], message: 'B' },
        C: { id: 'C', parents: ['A'], message: 'C' },
      },
      branches: {
        main: { name: 'main', tip: 'B' },
        feature: { name: 'feature', tip: 'C' },
      },
      head: { type: 'branch', ref: 'main' },
    },
    allowedOps: ['merge'],
    target: [{ type: 'HAS_MERGE_COMMIT_ON_BRANCH', branch: 'main' }],
    hint: 'Когда ветки разошлись, FF невозможен.',
    explanation: 'git merge feature создаст merge-коммит с двумя родителями.',
    maxScore: 10,
  },
];
