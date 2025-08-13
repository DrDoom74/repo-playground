import { Task } from '@/git/types';

export const tasks: Task[] = [
  {
    id: 'T01',
    title: 'Переключение ветки (checkout)',
    level: 'basic',
    description: `
## Задача
Сейчас HEAD указывает на ветку **main**. Тебе нужно переключиться на ветку **feature**.

## Что такое checkout?
- Команда \`git checkout\` перемещает HEAD на указанную ветку или коммит
- После checkout ты будешь "находиться" на другой ветке
- Все новые коммиты будут добавляться к той ветке, на которой находится HEAD

## Цель
HEAD должен указывать на ветку **feature** вместо **main**.
    `,
    initial: {
      commits: {
        A: { id: 'A', parents: [], message: 'Начальный коммит' },
        B: { id: 'B', parents: ['A'], message: 'Добавили функцию' },
      },
      branches: {
        main: { name: 'main', tip: 'B' },
        feature: { name: 'feature', tip: 'A' },
      },
      head: { type: 'branch', ref: 'main' },
    },
    allowedOps: ['checkout'],
    target: [{ type: 'HEAD_AT_BRANCH', branch: 'feature' }],
    hint: 'Используй команду `git checkout feature` или нажми кнопку "Переключиться на feature" в быстрых действиях.',
    explanation: 'Команда `git checkout feature` перемещает HEAD на ветку feature. Теперь все новые коммиты будут добавлены к ветке feature.',
    maxScore: 8,
  },
  {
    id: 'T02',
    title: 'Создание новой ветки',
    level: 'basic',
    description: `
## Задача
Создай новую ветку **hotfix** от текущего коммита (B).

## Что такое ветка в Git?
- Ветка — это просто указатель на конкретный коммит
- Когда ты создаёшь ветку, Git создаёт новый указатель
- Новая ветка будет указывать на тот же коммит, где сейчас находится HEAD

## Цель
После выполнения должна существовать ветка **hotfix**, которая указывает на коммит **B**.

💡 **Подсказка**: HEAD при этом остаётся на ветке main.
    `,
    initial: {
      commits: {
        A: { id: 'A', parents: [], message: 'Начальный коммит' },
        B: { id: 'B', parents: ['A'], message: 'Основная функция' },
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
    hint: 'Используй команду `git branch hotfix` или кнопку "Создать новую ветку" в быстрых действиях.',
    explanation: 'Команда `git branch hotfix` создаёт новую ветку hotfix, которая указывает на текущий коммит (B). HEAD при этом остаётся на ветке main.',
    maxScore: 8,
  },
  {
    id: 'T03',
    title: 'Fast-forward merge',
    level: 'basic',
    description: `
## Задача
Слей ветку **feature** в **main** с помощью fast-forward merge.

## Что такое Fast-forward merge?
- Происходит, когда target-ветка (main) является предком source-ветки (feature)
- Git просто перемещает указатель target-ветки вперёд
- **Новый merge-коммит НЕ создаётся**
- История остаётся линейной

## Текущая ситуация
- main указывает на коммит B
- feature указывает на коммит C (который идёт после B)
- main является предком feature → возможен FF

## Цель
После merge ветка **main** должна указывать на коммит **C**, а история должна остаться линейной.
    `,
    initial: {
      commits: {
        A: { id: 'A', parents: [], message: 'Начальный коммит' },
        B: { id: 'B', parents: ['A'], message: 'Основная функция' },
        C: { id: 'C', parents: ['B'], message: 'Новая фича' },
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
    hint: 'Fast-forward возможен, потому что main (B) является предком feature (C). Используй `git merge feature`.',
    explanation: 'Команда `git merge feature` выполнила fast-forward: указатель main просто переместился на коммит C. Новый merge-коммит не был создан, поэтому история осталась линейной.',
    maxScore: 10,
  },
  {
    id: 'T04',
    title: 'Merge с созданием merge-коммита',
    level: 'basic',
    description: `
## Задача
Слей ветку **feature** в **main**. В этот раз должен создаться merge-коммит.

## Когда создаётся merge-коммит?
- Когда ветки "разошлись" (diverged)
- То есть у каждой ветки есть уникальные коммиты
- Fast-forward невозможен

## Текущая ситуация
- main и feature разошлись от общего предка A
- main имеет уникальный коммит B
- feature имеет уникальный коммит C
- Fast-forward невозможен → будет создан merge-коммит

## Цель
После merge на вершине ветки **main** должен появиться merge-коммит с двумя родителями: B и C.

💡 **Важно**: Merge-коммит объединяет изменения из обеих веток.
    `,
    initial: {
      commits: {
        A: { id: 'A', parents: [], message: 'Начальный коммит' },
        B: { id: 'B', parents: ['A'], message: 'Функция main' },
        C: { id: 'C', parents: ['A'], message: 'Функция feature' },
      },
      branches: {
        main: { name: 'main', tip: 'B' },
        feature: { name: 'feature', tip: 'C' },
      },
      head: { type: 'branch', ref: 'main' },
    },
    allowedOps: ['merge'],
    target: [{ type: 'HAS_MERGE_COMMIT_ON_BRANCH', branch: 'main' }],
    hint: 'Поскольку ветки разошлись (B и C имеют разных родителей), Git создаст merge-коммит. Используй `git merge feature`.',
    explanation: 'Git создал merge-коммит, потому что ветки разошлись. Merge-коммит имеет двух родителей (B и C), объединяя изменения из обеих веток.',
    maxScore: 10,
  },
];
