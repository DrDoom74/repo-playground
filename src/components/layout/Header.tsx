import { Link, NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

export default function Header() {
  const resetProgress = () => {
    localStorage.removeItem('git-trainer:v1:progress');
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('progress-reset'));
    toast({ title: 'Прогресс сброшен' });
  };

  const navClass = ({ isActive }: any) =>
    `px-3 py-2 rounded-md text-sm ${isActive ? 'bg-secondary' : 'hover:bg-accent'}`;

  return (
    <header className="border-b sticky top-0 z-10 bg-background/80 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between py-3">
        <Link to="/" className="font-semibold tracking-tight">AKlimenko School — Git тренажёр</Link>
        <nav className="flex items-center gap-1">
          <NavLink className={navClass} to="/tasks">Задачи</NavLink>
          <NavLink className={navClass} to="/sandbox">Песочница</NavLink>
          <NavLink className={navClass} to="/theory">Теория</NavLink>
        </nav>
        <Button variant="secondary" onClick={resetProgress}>Сброс прогресса</Button>
      </div>
    </header>
  );
}
