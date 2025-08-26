import { useEffect, useMemo, useState, useCallback } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { GitTerminal } from '@/components/git/terminal/GitTerminal';
import { BranchOverview } from '@/components/git/BranchOverview';
import { TerminalHints } from '@/components/git/terminal/TerminalHints';
import { TaskFeedback } from '@/components/tasks/TaskFeedback';
import { tasks } from '@/tasks/tasks';
import { useGitStore } from '@/state/gitStore';
import { checkAssertion } from '@/tasks/assertions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useProgress } from '@/hooks/useProgress';

export default function TasksPage() {
  const git = useGitStore();
  const [taskIdx, setTaskIdx] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [hasCompletedOnLoad, setHasCompletedOnLoad] = useState(false);
  const [terminalKey, setTerminalKey] = useState(0);
  const currentTask = tasks[taskIdx];
  const { progress, updateProgress } = useProgress();

  const isCompleted = useMemo(() => {
    return currentTask.target.every(assertion => checkAssertion(git.repo, assertion));
  }, [git.repo, currentTask.target]);

  const resetTask = useCallback(() => {
    git.reset(structuredClone(currentTask.initial));
    setTerminalKey(prev => prev + 1);
    toast({ title: 'Задача сброшена', description: 'Репозиторий и терминал очищены' });
  }, [git, currentTask.initial]);

  useEffect(() => {
    git.reset(structuredClone(currentTask.initial));
    setShowHint(false);
    setShowExplanation(false);
    setTerminalKey(prev => prev + 1);
    // Check if task is already completed on load to prevent auto-completion
    const isCompletedOnLoad = currentTask.target.every(assertion => checkAssertion(currentTask.initial, assertion));
    setHasCompletedOnLoad(isCompletedOnLoad);
  }, [taskIdx, currentTask.initial]);

  useEffect(() => {
    // Only mark as completed if it wasn't completed on initial load
    if (isCompleted && !hasCompletedOnLoad) {
      const baseScore = currentTask.maxScore;
      const penalty = (showHint ? 2 : 0) + (showExplanation ? 5 : 0);
      const score = Math.max(0, baseScore - penalty);
      
      if (!progress.solvedTaskIds.includes(currentTask.id)) {
        const newProgress = {
          ...progress,
          solvedTaskIds: [...progress.solvedTaskIds, currentTask.id],
          scoreByTask: { ...progress.scoreByTask, [currentTask.id]: score }
        };
        updateProgress(newProgress);
        toast({ 
          title: 'Задача выполнена! 🎉', 
          description: `Получено баллов: ${score}/${baseScore}` 
        });
      }
    }
  }, [isCompleted, hasCompletedOnLoad, showHint, showExplanation, currentTask, progress, updateProgress]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto py-6">
        {/* Mobile Layout */}
        <div className="block lg:hidden space-y-6">
          {/* Task List - Collapsible */}
          <Card>
            <CardHeader>
              <CardTitle>Задачи ({taskIdx + 1}/{tasks.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {tasks.map((task, i) => {
                  const isSolved = progress.solvedTaskIds.includes(task.id);
                  const isCurrent = i === taskIdx;
                  return (
                    <Button
                      key={task.id}
                      variant={isCurrent ? 'default' : 'ghost'}
                      className="text-xs h-auto p-2"
                      onClick={() => setTaskIdx(i)}
                    >
                      <span className="mr-1">
                        {isSolved ? '✅' : '🔓'}
                      </span>
                      <span className="truncate">{task.id}</span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Main Task */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{currentTask.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 prose prose-sm max-w-none dark:prose-invert text-sm">
                <div dangerouslySetInnerHTML={{ __html: currentTask.description.replace(/\n/g, '<br>') }} />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <BranchOverview />
                <div className="h-[300px]">
                  <GitTerminal key={terminalKey} />
                </div>
              </div>
              
              {/* Task Progress */}
              <div className="mt-4">
                <TaskFeedback 
                  currentState={git.repo}
                  targetAssertions={currentTask.target}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={resetTask} className="text-xs min-w-0">
                  Сбросить
                </Button>
                <Button variant="outline" onClick={() => setShowHint(!showHint)} className="text-xs min-w-0 truncate">
                  {showHint ? 'Скрыть подсказку' : 'Подсказку'}
                </Button>
                <Button variant="outline" onClick={() => setShowExplanation(!showExplanation)} className="text-xs min-w-0 truncate">
                  {showExplanation ? 'Скрыть объяснение' : 'Объяснение'}
                </Button>
              </div>
              
              {showHint && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
                  <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">💡 Подсказка</div>
                  {currentTask.hint}
                </div>
              )}
              
              {showExplanation && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg text-sm">
                  <div className="font-medium text-green-800 dark:text-green-200 mb-1">✅ Объяснение</div>
                  {currentTask.explanation}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hints Panel */}
          <TerminalHints />
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:grid grid-cols-12 gap-6">
          <aside className="col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Задачи</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tasks.map((task, i) => {
                    const isSolved = progress.solvedTaskIds.includes(task.id);
                    const isCurrent = i === taskIdx;
                    return (
                      <Button
                        key={task.id}
                        variant={isCurrent ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => setTaskIdx(i)}
                      >
                        <span className="mr-2">
                          {isSolved ? '✅' : '🔓'}
                        </span>
                        <span className="truncate">{task.title}</span>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </aside>

          <section className="col-span-6">
            <Card>
              <CardHeader>
                <CardTitle>{currentTask.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 prose prose-sm max-w-none dark:prose-invert">
                  <div dangerouslySetInnerHTML={{ __html: currentTask.description.replace(/\n/g, '<br>') }} />
                </div>
                <div className="h-[400px]">
                  <GitTerminal key={terminalKey} />
                </div>
                
                {/* Task Progress */}
                <div className="mt-4">
                  <TaskFeedback 
                    currentState={git.repo}
                    targetAssertions={currentTask.target}
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={resetTask} className="min-w-0">
                    Сбросить задачу
                  </Button>
                  <Button variant="outline" onClick={() => setShowHint(!showHint)} className="min-w-0 truncate">
                    {showHint ? 'Скрыть подсказку' : 'Показать подсказку'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowExplanation(!showExplanation)} className="min-w-0 truncate">
                    {showExplanation ? 'Скрыть объяснение' : 'Показать объяснение'}
                  </Button>
                </div>
                
                {showHint && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
                    <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">💡 Подсказка</div>
                    {currentTask.hint}
                  </div>
                )}
                
                {showExplanation && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg text-sm">
                    <div className="font-medium text-green-800 dark:text-green-200 mb-1">✅ Объяснение</div>
                    {currentTask.explanation}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <aside className="col-span-3">
            <div className="space-y-6">
              <BranchOverview />
              <TerminalHints />
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function getAvoidCommands(taskId: string): string[] {
  switch (taskId) {
    case 'T01':
      return ['git checkout feature'];
    case 'T02':
      return ['git branch hotfix'];
    default:
      return [];
  }
}