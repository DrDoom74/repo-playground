import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { GitTerminal } from '@/components/git/terminal/GitTerminal';
import { BranchOverview } from '@/components/git/BranchOverview';
import { TerminalHints } from '@/components/git/terminal/TerminalHints';
import { useEffect } from 'react';
import { useGitStore } from '@/state/gitStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SandboxPage() {
  const git = useGitStore();
  
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
      <main className="container mx-auto py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Git Песочница</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Button variant="outline" onClick={() => {
                git.reset({
                  commits: { A: { id: 'A', parents: [], message: 'init' } },
                  branches: { main: { name: 'main', tip: 'A' } },
                  head: { type: 'branch', ref: 'main' },
                });
                // Also clear terminal if GitTerminal component has a ref
                window.location.reload(); // Simple solution for now
              }}>Сбросить репозиторий</Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6">
          <div className="lg:col-span-2">
            <GitTerminal />
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
