import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { GitGraph } from '@/components/git/GitGraph';
import { ActionsPanel } from '@/components/git/ActionsPanel';
import { useEffect } from 'react';
import { useGitStore } from '@/state/gitStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

export default function SandboxPage() {
  const git = useGitStore();
  useEffect(() => {
    git.reset({
      commits: { A: { id: 'A', parents: [], message: 'init' } },
      branches: { main: { name: 'main', tip: 'A' } },
      head: { type: 'branch', ref: 'main' },
    });
  }, []);

  const checkFF = (a: string, b: string) => {
    const A = git.repo.branches[a]?.tip;
    const B = git.repo.branches[b]?.tip;
    if (!A || !B) return toast({ title: 'Укажите существующие ветки' });
    const isFF = isAncestor(git.repo.commits as any, A, B);
    toast({ title: 'FF-проверка', description: isFF ? `${a} -> ${b} возможен FF` : 'FF невозможен' });
  };

  const isAncestor = (commits: any, ancestor: string, descendant: string): boolean => {
    if (ancestor === descendant) return true;
    const visited = new Set<string>();
    const stack = [descendant];
    while (stack.length) {
      const id = stack.pop()!;
      if (visited.has(id)) continue;
      visited.add(id);
      const parents = commits[id]?.parents || [];
      for (const p of parents) {
        if (p === ancestor) return true;
        stack.push(p);
      }
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Песочница</CardTitle>
            </CardHeader>
            <CardContent>
              <GitGraph state={git.repo} height={480} />
              <div className="mt-4 flex gap-2">
                <Button variant="secondary" onClick={() => git.reset({
                  commits: { A: { id: 'A', parents: [], message: 'init' } },
                  branches: { main: { name: 'main', tip: 'A' } },
                  head: { type: 'branch', ref: 'main' },
                })}>Сбросить</Button>
              </div>
            </CardContent>
          </Card>
        </section>
        <aside className="lg:col-span-4">
          <ActionsPanel />
          <div className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Подсказки</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Проверь FF: merge возможен без коммита, если tip(target) — предок tip(from).</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => checkFF('main', 'feature')}>FF main←feature?</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>
      </main>
      <Footer />
    </div>
  );
}
