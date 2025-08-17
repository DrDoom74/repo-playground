import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="container mx-auto py-16 text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">Git тренажёр для новичков</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Интерактивные задачи и песочница для освоения веток, merge/rebase, reset и cherry-pick. Учись наглядно и с автопроверкой.</p>
        <div className="flex items-center justify-center gap-3">
          <a href="/tasks" className="inline-flex items-center px-5 py-3 rounded-md bg-primary text-primary-foreground">Перейти к задачам</a>
          <a href="/sandbox" className="inline-flex items-center px-5 py-3 rounded-md border">Открыть песочницу</a>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Index;
