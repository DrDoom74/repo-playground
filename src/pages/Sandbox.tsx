import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { GitTerminal } from '@/components/git/terminal/GitTerminal';
import { BranchOverview } from '@/components/git/BranchOverview';
import { TerminalHints } from '@/components/git/terminal/TerminalHints';
import { useEffect, useState } from 'react';
import { useGitStore } from '@/state/gitStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

export default function SandboxPage() {
  const git = useGitStore();
  const [terminalKey, setTerminalKey] = useState(0);
  
  const resetRepository = () => {
    const initial = {
      commits: {
        A: { id: 'A', parents: [], message: 'init' },
        B: { id: 'B', parents: ['A'], message: 'add file' },
        C: { id: 'C', parents: ['B'], message: 'fix bug' },
        D: { id: 'D', parents: ['B'], message: 'add feature' },
      },
      branches: {
        main: { name: 'main', tip: 'C' },
        feature: { name: 'feature', tip: 'D' },
      },
      head: { type: 'branch' as const, ref: 'main' },
    };
    git.reset(initial);
    setTerminalKey(prev => prev + 1);
    toast({
      title: "Repository Reset",
      description: "Repository has been reset to initial state",
    });
  };

  useEffect(() => {
    resetRepository();
  }, []);


  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Git Песочница</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Button variant="outline" onClick={resetRepository}>
                Сбросить репозиторий
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6">
          <div className="lg:col-span-2">
            <GitTerminal key={terminalKey} />
          </div>
          <div className="space-y-6">
            <BranchOverview />
            <TerminalHints />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
