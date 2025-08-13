import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { GitGraph } from '@/components/git/GitGraph';
import { SmartActionsPanel } from '@/components/git/SmartActionsPanel';
import { TaskFeedback } from '@/components/tasks/TaskFeedback';
import { tasks } from '@/tasks/tasks';
import { useGitStore } from '@/state/gitStore';
import { checkAssertion } from '@/tasks/assertions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

export default function TasksPage() {
  const git = useGitStore();
  const [taskIdx, setTaskIdx] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const currentTask = tasks[taskIdx];

  const isCompleted = useMemo(() => {
    return currentTask.target.every(assertion => checkAssertion(git.repo, assertion));
  }, [git.repo, currentTask.target]);

  const progress = useMemo(loadProgress, []);

  useEffect(() => {
    git.reset(structuredClone(currentTask.initial));
    setShowHint(false);
    setShowExplanation(false);
  }, [taskIdx, currentTask.initial]);

  useEffect(() => {
    if (isCompleted) {
      const progress = loadProgress();
      const baseScore = currentTask.maxScore;
      const penalty = (showHint ? 2 : 0) + (showExplanation ? 5 : 0);
      const score = Math.max(0, baseScore - penalty);
      
      if (!progress.solvedTaskIds.includes(currentTask.id)) {
        progress.solvedTaskIds.push(currentTask.id);
        progress.scoreByTask[currentTask.id] = score;
        saveProgress(progress);
        toast({ 
          title: 'Задача выполнена! 🎉', 
          description: `Получено баллов: ${score}/${baseScore}` 
        });
      }
    }
  }, [isCompleted, showHint, showExplanation, currentTask]);

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
              <GitGraph state={git.repo} height={280} />
              
              {/* Task Progress */}
              <div className="mt-4">
                <TaskFeedback 
                  currentState={git.repo}
                  targetAssertions={currentTask.target}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => git.reset(currentTask.initial)} className="text-xs">
                  Сбросить
                </Button>
                <Button variant="outline" onClick={() => setShowHint(!showHint)} className="text-xs">
                  {showHint ? 'Скрыть подсказку' : 'Подсказку'}
                </Button>
                <Button variant="outline" onClick={() => setShowExplanation(!showExplanation)} className="text-xs">
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

          {/* Actions Panel */}
          <SmartActionsPanel allowedOps={currentTask.allowedOps} />
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
                <GitGraph state={git.repo} height={320} />
                
                {/* Task Progress */}
                <div className="mt-4">
                  <TaskFeedback 
                    currentState={git.repo}
                    targetAssertions={currentTask.target}
                  />
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="secondary" onClick={() => git.reset(currentTask.initial)}>
                    Сбросить задачу
                  </Button>
                  <Button variant="outline" onClick={() => setShowHint(!showHint)}>
                    {showHint ? 'Скрыть подсказку' : 'Показать подсказку'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowExplanation(!showExplanation)}>
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
            <SmartActionsPanel allowedOps={currentTask.allowedOps} />
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem('git-trainer:v1:progress') || '{"solvedTaskIds":[],"scoreByTask":{}}');
  } catch {
    return { solvedTaskIds: [], scoreByTask: {} as Record<string, number> };
  }
}

function saveProgress(progress: any) {
  localStorage.setItem('git-trainer:v1:progress', JSON.stringify(progress));
}