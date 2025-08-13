import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGitStore } from '@/state/gitStore';
import { GitBranch, GitCommit, GitMerge, RotateCcw, Cherry, Terminal, AlertCircle } from 'lucide-react';
import { validateCommand } from './CommandValidator';

interface SmartActionsPanelProps {
  allowedOps?: string[];
}

export const SmartActionsPanel = ({ allowedOps }: SmartActionsPanelProps) => {
  const git = useGitStore();
  const [cmd, setCmd] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const can = (op: string) => !allowedOps || allowedOps.includes(op);

  // Smart suggestions based on current state
  const suggestions = useMemo(() => {
    const suggestions: Array<{ label: string; command: string; description: string; icon: any }> = [];
    
    // Available branches for checkout
    Object.keys(git.repo.branches).forEach(branch => {
      if (branch !== git.repo.head.ref) {
        suggestions.push({
          label: `Переключиться на ${branch}`,
          command: `git checkout ${branch}`,
          description: `Переместить HEAD на ветку ${branch}`,
          icon: GitBranch
        });
      }
    });
    
    // Create branch
    if (can('branch.create')) {
      suggestions.push({
        label: 'Создать новую ветку',
        command: 'git branch new-branch',
        description: 'Создать ветку от текущего коммита',
        icon: GitBranch
      });
    }
    
    // Commit
    if (can('commit')) {
      suggestions.push({
        label: 'Создать коммит',
        command: 'git commit -m "new commit"',
        description: 'Создать новый коммит',
        icon: GitCommit
      });
    }
    
    // Merge suggestions
    if (can('merge')) {
      Object.keys(git.repo.branches).forEach(branch => {
        if (branch !== git.repo.head.ref && git.repo.head.type === 'branch') {
          suggestions.push({
            label: `Слить ${branch}`,
            command: `git merge ${branch}`,
            description: `Слить ветку ${branch} в ${git.repo.head.ref}`,
            icon: GitMerge
          });
        }
      });
    }
    
    return suggestions;
  }, [git.repo, allowedOps]);

  const runCommand = (command: string) => {
    setCmd(command);
    setShowSuggestions(false);
  };

  const executeCommand = (command: string = cmd) => {
    if (!command.trim()) return;
    
    const validation = validateCommand(command.trim(), git.repo);
    if (!validation.valid) {
      git.logs.unshift({ 
        ts: Date.now(), 
        op: 'error', 
        message: validation.error || 'Ошибка валидации' 
      });
      return;
    }
    
    try {
      parseAndRun(command.trim(), git);
      setCmd('');
      setShowSuggestions(false);
    } catch (error) {
      console.error('Command failed:', error);
    }
  };

  const currentValidation = useMemo(() => {
    if (!cmd.trim()) return null;
    const validation = validateCommand(cmd.trim(), git.repo);
    return {
      ...validation,
      type: validation.valid ? 'success' : validation.suggestion ? 'hint' : 'error'
    };
  }, [cmd, git.repo]);

  const filteredSuggestions = suggestions.filter(s => 
    !cmd || s.command.toLowerCase().includes(cmd.toLowerCase()) || 
    s.label.toLowerCase().includes(cmd.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            Быстрые действия
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            {/* Current state info */}
            <div className="text-sm text-muted-foreground mb-2">
              HEAD: {git.repo.head.type === 'branch' ? (
                <Badge variant="outline">{git.repo.head.ref}</Badge>
              ) : (
                <Badge variant="secondary">detached at {git.repo.head.ref}</Badge>
              )}
            </div>
            
            {/* Smart suggestions */}
            {filteredSuggestions.slice(0, 4).map((suggestion, i) => (
              <Button
                key={i}
                variant="outline"
                className="justify-start text-left h-auto p-3"
                onClick={() => runCommand(suggestion.command)}
                disabled={!can(getOperationFromCommand(suggestion.command))}
              >
                <suggestion.icon className="w-4 h-4 mr-2 flex-shrink-0" />
                <div>
                  <div className="font-medium">{suggestion.label}</div>
                  <div className="text-xs text-muted-foreground">{suggestion.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Command Line */}
      <Card>
        <CardHeader>
          <CardTitle>Командная строка</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={cmd}
                  onChange={(e) => {
                    setCmd(e.target.value);
                    setShowSuggestions(e.target.value.length > 0);
                  }}
                  placeholder="git checkout main"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      executeCommand();
                    } else if (e.key === 'Escape') {
                      setShowSuggestions(false);
                    }
                  }}
                  onFocus={() => setShowSuggestions(cmd.length > 0)}
                  className={`font-mono ${currentValidation && !currentValidation.valid ? 'border-destructive' : ''}`}
                />
                <Button 
                  onClick={() => executeCommand()}
                  disabled={currentValidation && !currentValidation.valid}
                >
                  Выполнить
                </Button>
              </div>
              
              {/* Validation feedback */}
              {currentValidation && !currentValidation.valid && (
                <div className={`flex items-start gap-2 p-2 rounded-md ${
                  currentValidation.type === 'hint' 
                    ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'
                    : 'bg-destructive/10 border border-destructive/20'
                }`}>
                  <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                    currentValidation.type === 'hint' 
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-destructive'
                  }`} />
                  <div className="text-sm">
                    <div className={`font-medium ${
                      currentValidation.type === 'hint' 
                        ? 'text-blue-800 dark:text-blue-200'
                        : 'text-destructive'
                    }`}>{currentValidation.error}</div>
                    {currentValidation.suggestion && (
                      <div className="text-muted-foreground mt-1">{currentValidation.suggestion}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Command suggestions */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="border border-border rounded-md bg-card">
                {filteredSuggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    className="w-full text-left p-2 hover:bg-muted border-b border-border last:border-b-0 text-sm"
                    onClick={() => {
                      setCmd(suggestion.command);
                      setShowSuggestions(false);
                    }}
                  >
                    <div className="font-mono text-primary">{suggestion.command}</div>
                    <div className="text-xs text-muted-foreground">{suggestion.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Log */}
      <Card>
        <CardHeader>
          <CardTitle>История команд</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-48 overflow-auto text-sm">
            {git.logs.slice(0, 10).map((log, i) => (
              <div key={i} className="flex items-start gap-2 py-1">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(log.ts).toLocaleTimeString()}
                </span>
                <Badge variant={log.op === 'error' ? 'destructive' : 'secondary'} className="text-xs">
                  {log.op}
                </Badge>
                <span className="text-xs flex-1">{log.message}</span>
              </div>
            ))}
            {git.logs.length === 0 && (
              <div className="text-muted-foreground text-center py-4">
                Команды будут отображаться здесь
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

function getOperationFromCommand(command: string): string {
  const parts = command.split(' ');
  if (parts[0] !== 'git') return '';
  
  const subcommand = parts[1];
  switch (subcommand) {
    case 'checkout': return 'checkout';
    case 'branch': return 'branch.create';
    case 'commit': return 'commit';
    case 'merge': return 'merge';
    case 'rebase': return 'rebase';
    case 'reset': return 'reset.hard';
    case 'cherry-pick': return 'cherry-pick';
    default: return subcommand;
  }
}

function parseAndRun(cmd: string, git: ReturnType<typeof useGitStore.getState>) {
  const parts = cmd.split(/\s+/);
  if (parts[0] !== 'git') {
    throw new Error('Команды должны начинаться с "git"');
  }
  
  const sub = parts[1];
  switch (sub) {
    case 'checkout':
      if (!parts[2]) throw new Error('Укажите ветку или коммит для checkout');
      git.checkout(parts[2]);
      break;
    case 'branch':
      if (!parts[2]) throw new Error('Укажите имя новой ветки');
      git.createBranch(parts[2]);
      break;
    case 'commit': {
      const msgIdx = parts.indexOf('-m');
      const msg = msgIdx !== -1 ? 
        parts.slice(msgIdx + 1).join(' ').replace(/^"|"$/g, '') : 
        'commit';
      git.commit(msg);
      break;
    }
    case 'merge':
      if (!parts[2]) throw new Error('Укажите ветку для merge');
      git.merge(parts[2]);
      break;
    case 'rebase':
      if (!parts[2]) throw new Error('Укажите ветку для rebase');
      git.rebase(parts[2]);
      break;
    case 'reset':
      if (parts[2] === '--hard' && parts[3]) {
        git.resetHard(parts[3]);
      } else {
        throw new Error('Используйте: git reset --hard <commit>');
      }
      break;
    case 'cherry-pick':
      if (!parts[2]) throw new Error('Укажите коммит для cherry-pick');
      git.cherryPick(parts[2]);
      break;
    default:
      throw new Error(`Неизвестная команда: ${sub}`);
  }
}