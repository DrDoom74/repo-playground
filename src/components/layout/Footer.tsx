import { useProgress } from '@/hooks/useProgress';

export default function Footer() {
  const { totalScore } = useProgress();
  
  return (
    <footer className="border-t mt-10">
      <div className="container mx-auto py-6 text-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div>AKlimenko School • для обучающих целей</div>
          <nav className="flex flex-wrap gap-4 text-muted-foreground">
            <a href="https://t.me/QA_AKlimenko" target="_blank" rel="noreferrer">Telegram</a>
            <a href="https://boosty.to/" target="_blank" rel="noreferrer">Boosty</a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer">YouTube</a>
            <a href="#" target="_blank" rel="noreferrer">Сайт с тренажёрами</a>
          </nav>
          <div className="flex items-center gap-4">
            <div className="text-primary font-medium">Очков: {totalScore}</div>
            <div>© {new Date().getFullYear()}</div>
          </div>
        </div>
        {/* Mobile score display */}
        <div className="md:hidden text-center mt-3 pt-3 border-t">
          <div className="text-primary font-medium">Набрано очков: {totalScore}</div>
        </div>
      </div>
    </footer>
  );
}
