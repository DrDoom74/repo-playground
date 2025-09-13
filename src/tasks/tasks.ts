import { Task } from '@/git/types';

export const tasks: Task[] = [
  {
    id: 'T01',
    title: 'Переключение ветки (checkout)',
    level: 'basic',
    description: `
## Задача
Сейчас HEAD указывает на ветку **main**. Тебе нужно переключиться на ветку **feature**.

## Что такое HEAD?
**HEAD** — это указатель, который показывает где ты сейчас находишься в Git:
- HEAD указывает на коммит, где ты работаешь прямо сейчас
- Обычно HEAD указывает на ветку, а ветка указывает на коммит
- Когда HEAD указывает на ветку — ты "находишься на этой ветке"
- Все новые коммиты будут добавляться к той ветке, на которой находится HEAD

## Что такое checkout?
- Команда \`git checkout\` перемещает HEAD на указанную ветку или коммит
- После checkout ты будешь "находиться" на другой ветке
- Это как переключение между разными версиями проекта

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
- Происходит, когда target-ветка (main) является родителем source-ветки (feature)
- Git просто перемещает указатель target-ветки вперёд
- **Новый merge-коммит НЕ создаётся**
- История остаётся линейной

## Что такое FF?
**FF** = **Fast-Forward** - быстрая перемотка указателя ветки без создания merge-коммита.

## Текущая ситуация
- main указывает на коммит B
- feature указывает на коммит C (который идёт после B)
- main является родителем feature → возможен Fast-Forward

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
  {
    id: 'T05',
    title: 'Rebase (перебазирование)',
    level: 'intermediate',
    description: `
## Задача
Перебазируй ветку **feature** на **develop**, чтобы получить линейную историю.

## Что такое rebase?
- Rebase **переносит** коммиты с одной ветки на другую (не сливает!)
- Создаёт **новые коммиты** с тем же содержимым, но новой историей
- В отличие от merge, не создаёт merge-коммит, получается линейная история
- Создаёт новые коммиты с тем же содержимым
- Результат: линейная история

## Текущая ситуация
- develop имеет новые коммиты (B, C)
- feature ответвилась от старого состояния develop (A)
- Нужно перенести коммиты feature поверх актуального develop

## Цель
После rebase ветка feature должна начинаться от коммита C, а история должна быть линейной.
    `,
    initial: {
      commits: {
        A: { id: 'A', parents: [], message: 'Начальный коммит' },
        B: { id: 'B', parents: ['A'], message: 'Обновление develop' },
        C: { id: 'C', parents: ['B'], message: 'Ещё один коммит develop' },
        D: { id: 'D', parents: ['A'], message: 'Функция feature' },
      },
      branches: {
        develop: { name: 'develop', tip: 'C' },
        feature: { name: 'feature', tip: 'D' },
      },
      head: { type: 'branch', ref: 'feature' },
    },
    allowedOps: ['rebase', 'checkout'],
    target: [
      { type: 'BRANCH_REBASED_ONTO', branch: 'feature', onto: 'develop' },
      { type: 'LINEAR_HISTORY', branch: 'feature' },
    ],
    hint: 'Используй `git rebase develop` находясь на ветке feature. Это перенесёт коммиты feature поверх develop.',
    explanation: 'Rebase создал новый коммит с тем же содержимием, что и D, но теперь он базируется на C. История стала линейной.',
    maxScore: 12,
  },
  {
    id: 'T06',
    title: 'Cherry-pick (выбор коммита)',
    level: 'intermediate',
    description: `
## Задача
Перенеси коммит **D** из ветки **feature** в ветку **main** с помощью cherry-pick.

## Что такое cherry-pick?
- Копирует конкретный коммит в текущую ветку
- Создаёт новый коммит с теми же изменениями
- Полезно для переноса отдельных фикс

## Текущая ситуация
- В feature есть важный коммит D с фиксом
- Нужно перенести только этот коммит в main
- Не весь feature готов для merge

## Цель
В ветке main должен появиться новый коммит с содержимым коммита D.
    `,
    initial: {
      commits: {
        A: { id: 'A', parents: [], message: 'Начальный коммит' },
        B: { id: 'B', parents: ['A'], message: 'Функция main' },
        C: { id: 'C', parents: ['A'], message: 'Начало feature' },
        D: { id: 'D', parents: ['C'], message: 'Важный фикс' },
      },
      branches: {
        main: { name: 'main', tip: 'B' },
        feature: { name: 'feature', tip: 'D' },
      },
      head: { type: 'branch', ref: 'main' },
    },
    allowedOps: ['cherry-pick', 'checkout'],
    target: [
      { type: 'COMMIT_MESSAGE_CONTAINS', commit: 'P1', text: 'cherry-pick: Важный фикс' },
      { type: 'BRANCH_AT_COMMIT', branch: 'main', commit: 'P1' },
    ],
    hint: 'Находясь на main, используй `git cherry-pick D` для копирования коммита D.',
    explanation: 'Cherry-pick создал новый коммит P1 в main с теми же изменениями, что и в коммите D.',
    maxScore: 10,
  },
  {
    id: 'T07',
    title: 'Reset --hard (жёсткий откат)',
    level: 'intermediate',
    description: `
## Задача
Откати ветку **main** с коммита **C** обратно на коммит **B** с помощью reset --hard.

## Что такое reset --hard?
- Перемещает указатель ветки на другой коммит
- Полностью удаляет изменения в рабочей директории
- **Опасная операция** - можно потерять работу
- Используется для отката нежелательных коммитов

## Текущая ситуация
- main указывает на коммит C
- Коммит C оказался ошибочным
- Нужно вернуться к состоянию B

## Цель
Ветка main должна указывать на коммит B вместо C.

⚠️ **Внимание**: В реальности reset --hard удаляет данные безвозвратно!
    `,
    initial: {
      commits: {
        A: { id: 'A', parents: [], message: 'Начальный коммит' },
        B: { id: 'B', parents: ['A'], message: 'Стабильная версия' },
        C: { id: 'C', parents: ['B'], message: 'Ошибочный коммит' },
      },
      branches: {
        main: { name: 'main', tip: 'C' },
      },
      head: { type: 'branch', ref: 'main' },
    },
    allowedOps: ['reset.hard'],
    target: [
      { type: 'BRANCH_AT_COMMIT', branch: 'main', commit: 'B' },
    ],
    hint: 'Используй `git reset --hard B` для отката main на коммит B.',
    explanation: 'Reset --hard переместил указатель main с C обратно на B. Коммит C больше не доступен через main.',
    maxScore: 8,
  },
  {
    id: 'T08',
    title: 'Detached HEAD (отсоединённый указатель)',
    level: 'intermediate',
    description: `
## Задача
1. Переключись на коммит **B** (detached HEAD)
2. Создай новую ветку **hotfix** из этого состояния

## Что такое Detached HEAD?
- HEAD указывает напрямую на коммит, а не на ветку
- Возникает при checkout на конкретный коммит
- Новые коммиты не будут принадлежать никакой ветке
- Нужно создать ветку, чтобы сохранить работу

## Текущая ситуация
- HEAD указывает на ветку main (коммит C)
- Нужно вернуться к коммиту B для создания hotfix

## Цель
1. HEAD должен указывать на коммит B (detached)
2. Должна существовать ветка hotfix на коммите B
    `,
    initial: {
      commits: {
        A: { id: 'A', parents: [], message: 'Начальный коммит' },
        B: { id: 'B', parents: ['A'], message: 'Стабильная версия' },
        C: { id: 'C', parents: ['B'], message: 'Новая функция' },
      },
      branches: {
        main: { name: 'main', tip: 'C' },
      },
      head: { type: 'branch', ref: 'main' },
    },
    allowedOps: ['checkout', 'branch.create'],
    target: [
      { type: 'BRANCH_EXISTS', branch: 'hotfix', exists: true },
      { type: 'BRANCH_AT_COMMIT', branch: 'hotfix', commit: 'B' },
    ],
    hint: 'Сначала `git checkout B`, затем `git branch hotfix` для создания ветки из detached состояния.',
    explanation: 'Checkout на коммит создал detached HEAD. Затем branch создал новую ветку hotfix из текущего состояния.',
    maxScore: 10,
  },
  {
    id: 'T09',
    title: 'Только fast-forward merge',
    level: 'intermediate',
    description: `
## Задача
Нужно сначала перебазировать **feature** на **main**, а затем сделать **fast-forward merge**.

## Почему именно эта последовательность?
1. **Rebase feature на main** — переносит коммиты feature поверх main, но feature остаётся впереди
2. **Merge feature в main** — перемещает указатель main к кончику feature (fast-forward)

## Важно понимать разницу:
- Просто rebase оставляет main позади
- Rebase + merge переносит main к финальному состоянию

## Результат
- Линейная история без merge-коммитов
- Все изменения feature интегрированы в main, main указывает на финальный коммит
    `,
    initial: {
      commits: {
        A: { id: 'A', parents: [], message: 'Начальный коммит' },
        B: { id: 'B', parents: ['A'], message: 'Коммит main' },
        C: { id: 'C', parents: ['A'], message: 'Коммит feature' },
      },
      branches: {
        main: { name: 'main', tip: 'B' },
        feature: { name: 'feature', tip: 'C' },
      },
      head: { type: 'branch', ref: 'main' },
    },
    allowedOps: ['rebase', 'merge', 'checkout'],
    target: [
      { type: 'NO_MERGE_COMMITS_ON_BRANCH', branch: 'main' },
      { type: 'LINEAR_HISTORY', branch: 'main' },
      { type: 'BRANCH_CONTAINS_COMMITS', branch: 'main', commits: ['R1'] },
      { type: 'BRANCH_REBASED_ONTO', branch: 'feature', onto: 'main' },
      { type: 'HEAD_AT_BRANCH', branch: 'main' },
    ],
    hint: 'Перебазируй feature на main, затем переключись на main и сделай fast-forward merge.',
    explanation: 'Rebase сделал возможным fast-forward merge. Результат: линейная история без merge-коммитов.',
    maxScore: 15,
  },
  {
    id: 'T10',
    title: 'Альтернативные способы интеграции',
    level: 'advanced',
    description: `
## Задача
Перенеси изменения из **feature** в **main** любым способом, сохранив линейную историю.

## Варианты решения
1. **Rebase + Fast-forward merge** — классический подход
2. **Cherry-pick конкретных коммитов** — выборочное копирование
3. **Только rebase** — оставить feature впереди (тоже валидно)

## Творческое задание
Выбери любой подход, который включит изменения из feature в main с линейной историей.

## Важно
Можно решить даже просто rebase без merge - главное, чтобы изменения попали в историю.

## Цель
- main должен содержать изменения из feature
- История должна остаться линейной
- Нет ограничений на способ достижения
    `,
    initial: {
      commits: {
        A: { id: 'A', parents: [], message: 'Начальный коммит' },
        B: { id: 'B', parents: ['A'], message: 'Коммит main' },
        C: { id: 'C', parents: ['A'], message: 'Функция feature' },
        D: { id: 'D', parents: ['C'], message: 'Доработка feature' },
      },
      branches: {
        main: { name: 'main', tip: 'B' },
        feature: { name: 'feature', tip: 'D' },
      },
      head: { type: 'branch', ref: 'main' },
    },
    allowedOps: ['rebase', 'merge', 'cherry-pick', 'checkout', 'reset.hard'],
    target: [
      { type: 'LINEAR_HISTORY', branch: 'main' },
      { type: 'HEAD_AT_BRANCH', branch: 'main' },
      { type: 'EITHER', anyOf: [
        { type: 'BRANCH_CONTAINS_COMMITS', branch: 'main', commits: ['R1'] },
        { type: 'BRANCH_CONTAINS_COMMITS', branch: 'main', commits: ['P1'] },
        { type: 'COMMIT_COUNT_ON_BRANCH', branch: 'main', gte: 4 },
      ]},
    ],
    hint: 'Есть несколько способов: rebase+merge, cherry-pick коммитов, или reset+commit. Выбери любой!',
    explanation: 'Отличная работа! Ты нашёл способ интегрировать изменения, сохранив линейную историю.',
    maxScore: 20,
  },
  {
    id: 'T11',
    title: 'Выбор оптимального инструмента',
    level: 'advanced',
    description: `
## Задание
Команда просит интегрировать изменения из **feature** в **main**. Выбери оптимальный инструмент.

## Доступные инструменты
- **Merge**: сохраняет историю, но создаёт merge-коммит
- **Rebase**: даёт чистую историю, но переписывает коммиты
- **Cherry-pick**: для выборочного переноса коммитов

## Анализ ситуации
- feature имеет 2 полезных коммита
- main развивался параллельно
- Команда предпочитает чистую историю

## Задание
Выбери и примени наиболее подходящий инструмент. Обоснуй выбор!

## Цель
Перенеси изменения из feature в main наиболее подходящим способом.
    `,
    initial: {
      commits: {
        A: { id: 'A', parents: [], message: 'Общий предок' },
        B: { id: 'B', parents: ['A'], message: 'Развитие main' },
        C: { id: 'C', parents: ['A'], message: 'Новая функция' },
        D: { id: 'D', parents: ['C'], message: 'Тесты для функции' },
      },
      branches: {
        main: { name: 'main', tip: 'B' },
        feature: { name: 'feature', tip: 'D' },
      },
      head: { type: 'branch', ref: 'feature' },
    },
    allowedOps: ['merge', 'rebase', 'cherry-pick', 'checkout'],
    target: [
      { type: 'EITHER', anyOf: [
        { type: 'BRANCH_CONTAINS_COMMITS', branch: 'main', commits: ['R1', 'R2'] },
        { type: 'HAS_MERGE_COMMIT_ON_BRANCH', branch: 'main' },
        { type: 'BRANCH_CONTAINS_COMMITS', branch: 'main', commits: ['P1', 'P2'] },
      ]},
    ],
    hint: 'Для чистой истории - rebase+merge. Для сохранения контекста - merge. Для выборочности - cherry-pick.',
    explanation: 'Каждый инструмент имеет свои преимущества. Выбор зависит от политики команды и ситуации в проекте.',
    maxScore: 25,
  },
  {
    id: 'T12',
    title: 'Комплексная интеграция: ветка + коммиты + merge',
    level: 'advanced',
    description: `
## Задача
Ты работаешь над новой функцией. Нужно:
1. Создать ветку **new-feature** 
2. Сделать коммит в этой ветке
3. Переключиться в **main** и сделать там коммит
4. Влить изменения из **main** в свою ветку через **merge**

## Реальный сценарий
Пока ты работал над функцией, команда добавила важные изменения в main. 
Тебе нужно получить эти изменения в свою ветку, чтобы работать с актуальным кодом.

## Цель
- Ветка **new-feature** должна содержать свой коммит + коммит из main
- В ветке **new-feature** должен быть merge-коммит
- На **new-feature** должно быть 5 коммитов всего
    `,
    initial: {
      commits: {
        A: { id: 'A', parents: [], message: 'Начальный коммит' },
        B: { id: 'B', parents: ['A'], message: 'Базовая функциональность' },
      },
      branches: {
        main: { name: 'main', tip: 'B' },
      },
      head: { type: 'branch', ref: 'main' },
    },
    allowedOps: ['branch.create', 'checkout', 'commit', 'merge'],
    target: [
      { type: 'BRANCH_EXISTS', branch: 'new-feature', exists: true },
      { type: 'COMMIT_COUNT_ON_BRANCH', branch: 'new-feature', eq: 5 },
      { type: 'HAS_MERGE_COMMIT_ON_BRANCH', branch: 'new-feature' },
      { type: 'HEAD_AT_BRANCH', branch: 'new-feature' },
    ],
    hint: 'Создай ветку, коммить, переключись на main, коммить там, вернись в ветку и влей main.',
    explanation: 'Ты успешно интегрировал изменения из main в свою ветку через merge, получив актуальные изменения команды.',
    maxScore: 20,
  },
  {
    id: 'T13',
    title: 'Комплексная интеграция: rebase для чистой истории',
    level: 'advanced',
    description: `
## Задача
Ты работаешь над **api-feature**. Команда обновила **develop**, и тебе нужно:
1. Создать ветку **api-feature** от **develop**
2. Сделать коммит в **api-feature**
3. Переключиться в **develop** и сделать там коммит  
4. Получить изменения из **develop** в свою ветку через **rebase**

## Отличие от предыдущей задачи
Здесь используется **rebase** вместо merge для получения линейной истории без merge-коммитов.

## Цель
- Ветка **api-feature** должна быть перебазирована на актуальный **develop**
- История должна быть линейной (без merge-коммитов)
- На **api-feature** должно быть 4 коммита всего
    `,
    initial: {
      commits: {
        A: { id: 'A', parents: [], message: 'Начальный коммит' },
        B: { id: 'B', parents: ['A'], message: 'API основа' },
      },
      branches: {
        develop: { name: 'develop', tip: 'B' },
      },
      head: { type: 'branch', ref: 'develop' },
    },
    allowedOps: ['branch.create', 'checkout', 'commit', 'rebase'],
    target: [
      { type: 'BRANCH_EXISTS', branch: 'api-feature', exists: true },
      { type: 'COMMIT_COUNT_ON_BRANCH', branch: 'api-feature', eq: 4 },
      { type: 'NO_MERGE_COMMITS_ON_BRANCH', branch: 'api-feature' },
      { type: 'HEAD_AT_BRANCH', branch: 'api-feature' },
    ],
    hint: 'Создай ветку, коммить, переключись на develop, коммить там, вернись в ветку и сделай rebase develop.',
    explanation: 'Rebase переписал твой коммит поверх актуального develop, создав чистую линейную историю.',
    maxScore: 20,
  },
  {
    id: 'T14',
    title: 'Мастер интеграции: выборочный cherry-pick',
    level: 'advanced',
    description: `
## Задача
Сложный сценарий интеграции:
1. Создать ветку **hotfix-branch**
2. Сделать 2 коммита в **hotfix-branch** 
3. Переключиться в **main** и сделать коммит
4. Перенести только **второй** коммит из **hotfix-branch** в **main** через **cherry-pick**

## Реальный сценарий  
В ветке hotfix два коммита: первый - экспериментальный, второй - готовый фикс.
Нужно перенести в main только готовый фикс.

## Цель
- В **main** должно быть 4 коммита всего
- В **main** должен появиться cherry-pick коммит
- HEAD должен быть на ветке **main**
    `,
    initial: {
      commits: {
        A: { id: 'A', parents: [], message: 'Стабильная версия' },
        B: { id: 'B', parents: ['A'], message: 'Релизная подготовка' },
      },
      branches: {
        main: { name: 'main', tip: 'B' },
      },
      head: { type: 'branch', ref: 'main' },
    },
    allowedOps: ['branch.create', 'checkout', 'commit', 'cherry-pick'],
    target: [
      { type: 'BRANCH_EXISTS', branch: 'hotfix-branch', exists: true },
      { type: 'COMMIT_COUNT_ON_BRANCH', branch: 'main', eq: 4 },
      { type: 'HEAD_AT_BRANCH', branch: 'main' },
      { type: 'COMMIT_MESSAGE_CONTAINS', commit: 'P1', text: 'cherry-pick:' },
    ],
    hint: 'Создай ветку, сделай 2 коммита, переключись на main, коммить, затем cherry-pick второго коммита из hotfix.',
    explanation: 'Cherry-pick позволил перенести только нужный коммит, оставив экспериментальный код в отдельной ветке.',
    maxScore: 25,
  },
];
