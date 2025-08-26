import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGitStore } from '@/state/gitStore';
import { Lightbulb, GitBranch, GitCommit, GitMerge } from 'lucide-react';

export function TerminalHints() {
  const git = useGitStore();
  const repo = git.repo;

  const getContextualHints = () => {
    const hints = [];
    const currentBranch = repo.head.type === 'branch' ? repo.head.ref : 'HEAD';
    const branches = Object.keys(repo.branches);
    const hasUncommittedChanges = false; // Simplified for now

    // Basic status hint
    hints.push({
      icon: <GitCommit className="h-4 w-4" />,
      title: 'Проверить статус',
      command: 'status',
      description: 'Показать текущее состояние репозитория'
    });

    // Branch-related hints
    if (branches.length === 1) {
      hints.push({
        icon: <GitBranch className="h-4 w-4" />,
        title: 'Создать ветку',
        command: 'branch feature-name',
        description: 'Создать новую ветку для разработки'
      });
    } else {
      hints.push({
        icon: <GitBranch className="h-4 w-4" />,
        title: 'Переключить ветку',
        command: 'checkout branch-name',
        description: 'Переключиться на другую ветку'
      });
    }

    // Commit hint
    hints.push({
      icon: <GitCommit className="h-4 w-4" />,
      title: 'Создать коммит',
      command: 'commit -m "описание изменений"',
      description: 'Зафиксировать изменения в репозитории'
    });

    // Merge hint if multiple branches exist
    if (branches.length > 1 && currentBranch !== 'main') {
      hints.push({
        icon: <GitMerge className="h-4 w-4" />,
        title: 'Слить ветки',
        command: 'merge main',
        description: 'Объединить изменения из другой ветки'
      });
    }

    return hints.slice(0, 4); // Show max 4 hints
  };

  const hints = getContextualHints();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Lightbulb className="h-4 w-4" />
          Подсказки
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-muted-foreground mb-3">
          Текущая ветка: <Badge variant="outline" className="text-xs">{repo.head.type === 'branch' ? repo.head.ref : 'HEAD'}</Badge>
        </div>
        
        {hints.map((hint, index) => (
          <div key={index} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              {hint.icon}
              <span className="text-sm font-medium">{hint.title}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {hint.description}
            </div>
            <Badge variant="secondary" className="text-xs font-mono">
              {hint.command}
            </Badge>
          </div>
        ))}

        <div className="mt-4 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
          💡 Команды можно вводить с префиксом "git" или без него
        </div>
      </CardContent>
    </Card>
  );
}