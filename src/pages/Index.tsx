// Update this page (the content is just a fallback if you fail to update the page)

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto py-16 text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">AKlimenko School — Git тренажёр</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Интерактивные задачи и песочница для освоения веток, merge/rebase, reset и cherry-pick. Учись наглядно и с автопроверкой.</p>
        <div className="flex items-center justify-center gap-3">
          <a href="/tasks" className="inline-flex items-center px-5 py-3 rounded-md bg-primary text-primary-foreground">Перейти к задачам</a>
          <a href="/sandbox" className="inline-flex items-center px-5 py-3 rounded-md border">Открыть песочницу</a>
        </div>
      </div>
    </div>
  );
};

export default Index;
