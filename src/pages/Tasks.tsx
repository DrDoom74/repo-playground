import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { GitGraph } from '@/components/git/GitGraph';
import { ActionsPanel } from '@/components/git/ActionsPanel';
import { tasks } from '@/tasks/tasks';
import { useGitStore } from '@/state/gitStore';
import { evaluateAssertions } from '@/tasks/assertions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

export default function TasksPage() {
  const git = useGitStore();
  const [taskIdx, setTaskIdx] = useState(0);
  const task = tasks[taskIdx];
  const [hintUsed, setHintUsed] = useState(false);
  const [explanationShown, setExplanationShown] = useState(false);
  const [passed, setPassed] = useState(false);
  const [details, setDetails] = useState<{ text: string; ok: boolean }[]>([]);

  useEffect(() => {
    git.reset(structuredClone(task.initial));
    setHintUsed(false);
    setExplanationShown(false);
    setPassed(false);
    setDetails([]);
  }, [taskIdx]);

  useEffect(() => {
    const res = evaluateAssertions(git.repo, task.target);
    setPassed(res.allPassed);
    setDetails(res.details.map((d) => ({ text: JSON.stringify(d.assertion), ok: d.passed })));
    if (res.allPassed) {
      const progress = loadProgress();
      const base = task.maxScore;
      const score = Math.max(0, base - (hintUsed ? 2 : 0) - (explanationShown ? 5 : 0));
      progress.solvedTaskIds = Array.from(new Set([...progress.solvedTaskIds, task.id]));
      progress.scoreByTask[task.id] = Math.max(progress.scoreByTask[task.id] || 0, score);
      saveProgress(progress);
      toast({ title: 'Задача сдана', description: `+${score} баллов` });
    }
  }, [git.repo]);

  const progress = useMemo(loadProgress, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-3 space-y-2">
          <Card>
            <CardHeader>
              <CardTitle>Список задач</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {tasks.map((t, i) => {
                  const solved = (progress.solvedTaskIds || []).includes(t.id);
                  return (
                    <li key={t.id}>
                      <Button variant={i===taskIdx? 'default':'secondary'} className="w-full justify-start" onClick={() => setTaskIdx(i)}>
                        {solved ? '✅' : '🔓'} {t.title}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </aside>

        <section className="lg:col-span-6">
          <Card>
            <CardHeader>
              <CardTitle>{task.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{task.description}</p>
              <GitGraph state={git.repo} height={420} />
              <div className="mt-4 flex items-center gap-3">
                <Button variant="secondary" onClick={() => git.reset(structuredClone(task.initial))}>Сбросить задачу</Button>
                <Button variant="outline" onClick={() => { setHintUsed(true); toast({ title: 'Подсказка', description: task.hint }); }}>Подсказка (-2)</Button>
                <Button variant="outline" onClick={() => { setExplanationShown(true); toast({ title: 'Объяснение', description: task.explanation }); }}>Показать решение (-5)</Button>
                {passed && <span className="text-green-600">Готово ✅</span>}
              </div>
              <div className="mt-3 text-sm">
                {details.map((d, idx) => (
                  <div key={idx} className={d.ok ? 'text-green-600' : 'text-amber-600'}>• {d.text} — {d.ok ? 'ok' : '…'}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <aside className="lg:col-span-3">
          <ActionsPanel allowedOps={task.allowedOps} />
        </aside>
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
function saveProgress(p: any) {
  localStorage.setItem('git-trainer:v1:progress', JSON.stringify(p));
}
