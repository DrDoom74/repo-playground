import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TheoryPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto py-8 grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Справочник команд</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-4 grid md:grid-cols-2 gap-4">
            <div>
              <code className="bg-muted px-2 py-1 rounded text-sm">git checkout &lt;branch&gt;</code>
              <p className="text-muted-foreground mt-1">Переключиться на указанную ветку</p>
            </div>
            <div>
              <code className="bg-muted px-2 py-1 rounded text-sm">git branch &lt;name&gt;</code>
              <p className="text-muted-foreground mt-1">Создать новую ветку с указанным именем</p>
            </div>
            <div>
              <code className="bg-muted px-2 py-1 rounded text-sm">git commit -m "&lt;message&gt;"</code>
              <p className="text-muted-foreground mt-1">Создать коммит с сообщением</p>
            </div>
            <div>
              <code className="bg-muted px-2 py-1 rounded text-sm">git merge &lt;branch&gt;</code>
              <p className="text-muted-foreground mt-1">Слить указанную ветку в текущую ветку</p>
            </div>
            <div>
              <code className="bg-muted px-2 py-1 rounded text-sm">git rebase &lt;branch&gt;</code>
              <p className="text-muted-foreground mt-1">Перебазировать текущую ветку на указанную ветку</p>
            </div>
            <div>
              <code className="bg-muted px-2 py-1 rounded text-sm">git cherry-pick &lt;commit&gt;</code>
              <p className="text-muted-foreground mt-1">Скопировать указанный коммит в текущую ветку</p>
            </div>
            <div>
              <code className="bg-muted px-2 py-1 rounded text-sm">git reset --hard &lt;commit&gt;</code>
              <p className="text-muted-foreground mt-1">Откатиться к указанному коммиту</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Ветка</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <div className="mb-3">
              <code className="bg-muted px-2 py-1 rounded text-xs">git branch &lt;name&gt;</code>
              <code className="bg-muted px-2 py-1 rounded text-xs ml-2">git checkout &lt;branch&gt;</code>
            </div>
            <p>Ветка — это движущийся указатель на коммит. Создание ветки не меняет файлы.</p>
            <p>Переключение ветки двигает HEAD и обновляет рабочее состояние (в тренажёре файлы не моделируются).</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>HEAD</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <div className="mb-3">
              <code className="bg-muted px-2 py-1 rounded text-xs">git checkout &lt;commit&gt;</code>
            </div>
            <p>HEAD указывает на текущую ветку или конкретный коммит (detached).</p>
            <p>Коммит создаётся поверх текущего HEAD-commit.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Fast-forward vs Merge-commit</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <div className="mb-3">
              <code className="bg-muted px-2 py-1 rounded text-xs">git merge &lt;branch&gt;</code>
            </div>
            <p>Fast-forward возможен, если target — предок source. Тогда двигается только указатель ветки.</p>
            <p>Иначе git создаёт merge-коммит с двумя родителями.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Rebase vs Merge</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <div className="mb-3">
              <code className="bg-muted px-2 py-1 rounded text-xs">git rebase &lt;branch&gt;</code>
              <code className="bg-muted px-2 py-1 rounded text-xs ml-2">git merge &lt;branch&gt;</code>
            </div>
            <p>Rebase переписывает коммиты поверх новой базы, создавая новые id и линейную историю.</p>
            <p>Merge сохраняет исходную структуру ветвления и создаёт merge-коммит.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Cherry-pick</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <div className="mb-3">
              <code className="bg-muted px-2 py-1 rounded text-xs">git cherry-pick &lt;commit&gt;</code>
            </div>
            <p>Перенос одного коммита поверх текущего HEAD без изменения остальной истории.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Reset vs Checkout</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <div className="mb-3">
              <code className="bg-muted px-2 py-1 rounded text-xs">git reset --hard &lt;commit&gt;</code>
              <code className="bg-muted px-2 py-1 rounded text-xs ml-2">git checkout &lt;commit&gt;</code>
            </div>
            <p>Checkout двигает HEAD. Reset двигает указатель ветки (в тренажёре используем --hard).</p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
