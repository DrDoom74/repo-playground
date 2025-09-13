import { tasks } from '@/tasks/tasks';
import { useProgress } from '@/hooks/useProgress';

export default function Footer() {
  const { totalScore } = useProgress();
  const maxPossibleScore = tasks.length * 3;
  
  return (
    <footer className="border-t mt-10">
      <div className="container mx-auto py-6 text-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div>Школа Алексея Клименко по тестированию ПО</div>
          <nav className="flex flex-wrap gap-4 text-muted-foreground">
            <a href="https://t.me/QA_AKlimenko" target="_blank" rel="noreferrer">Telegram</a>
            <a href="https://boosty.to/" target="_blank" rel="noreferrer">Boosty</a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer">YouTube</a>
            <a href="#" target="_blank" rel="noreferrer">Сайт с тренажёрами</a>
          </nav>
          <div>© {new Date().getFullYear()}</div>
        </div>
      </div>
    </footer>
  );
}
