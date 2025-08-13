import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TheoryPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto py-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Ветка</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Ветка — это движущийся указатель на коммит. Создание ветки не меняет файлы.</p>
            <p>Переключение ветки двигает HEAD и обновляет рабочее состояние (в тренажёре файлы не моделируются).</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>HEAD</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>HEAD указывает на текущую ветку или конкретный коммит (detached).</p>
            <p>Коммит создаётся поверх текущего HEAD-commit.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>FF vs merge-коммит</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Fast-forward возможен, если target — предок source. Тогда двигается только указатель ветки.</p>
            <p>Иначе git создаёт merge-коммит с двумя родителями.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Rebase vs Merge</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Rebase переписывает коммиты поверх новой базы, создавая новые id и линейную историю.</p>
            <p>Merge сохраняет исходную структуру ветвления и создаёт merge-коммит.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Cherry-pick</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Перенос одного коммита поверх текущего HEAD без изменения остальной истории.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Reset vs Checkout</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Checkout двигает HEAD. Reset двигает указатель ветки (в тренажёре используем --hard).</p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
