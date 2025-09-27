import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 container mx-auto py-16 text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">Git тренажёр для новичков</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Интерактивные задачи и песочница для освоения веток, merge/rebase, reset и cherry-pick. Учись наглядно и с автопроверкой.</p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/tasks" className="inline-flex items-center px-5 py-3 rounded-md bg-primary text-primary-foreground">Перейти к задачам</Link>
          <Link to="/sandbox" className="inline-flex items-center px-5 py-3 rounded-md border">Открыть песочницу</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
