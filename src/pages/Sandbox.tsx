import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { GitGraph } from '@/components/git/GitGraph';
import { SmartActionsPanel } from '@/components/git/SmartActionsPanel';
import { useEffect, useState } from 'react';
import { useGitStore } from '@/state/gitStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export default function SandboxPage() {
  const git = useGitStore();
  const [renderer, setRenderer] = useState<'custom' | 'mermaid'>('custom');
  
  useEffect(() => {
    git.reset({
      commits: { A: { id: 'A', parents: [], message: 'init' } },
      branches: { main: { name: 'main', tip: 'A' } },
      head: { type: 'branch', ref: 'main' },
    });
  }, []);


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
              <div className="mb-4">
                <Label className="text-sm font-medium mb-2 block">Рендерер графа:</Label>
                <RadioGroup 
                  value={renderer} 
                  onValueChange={(value: 'custom' | 'mermaid') => setRenderer(value)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom">Кастомный (Вертикальный)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mermaid" id="mermaid" />
                    <Label htmlFor="mermaid">Mermaid.js</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <GitGraph state={git.repo} height={480} renderer={renderer} />
              
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
          <SmartActionsPanel />
        </aside>
      </main>
      <Footer />
    </div>
  );
}
