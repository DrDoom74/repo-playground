import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useProgress } from '@/hooks/useProgress';
import { tasks } from '@/tasks/tasks';

export default function Header() {
  const { totalScore, resetProgress: resetProgressHook } = useProgress();
  const maxPossibleScore = tasks.length * 3;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const resetProgress = () => {
    resetProgressHook();
    toast({ title: 'Прогресс сброшен' });
    setIsMenuOpen(false);
    // Force page reload to ensure clean state
    window.location.reload();
  };

  const navClass = ({ isActive }: any) =>
    `px-3 py-2 rounded-md text-sm ${isActive ? 'bg-secondary' : 'hover:bg-accent'}`;

  const mobileNavClass = ({ isActive }: any) =>
    `block w-full px-4 py-3 text-left rounded-md ${isActive ? 'bg-secondary' : 'hover:bg-accent'}`;

  return (
    <header className="border-b sticky top-0 z-10 bg-background/80 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between py-3">
        {/* Logo - responsive text */}
        <Link to="/" className="font-semibold tracking-tight">
          <span className="hidden sm:block">Git тренажёр для новичков</span>
          <span className="block sm:hidden">Git тренажёр</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink className={navClass} to="/tasks">Задачи</NavLink>
          <NavLink className={navClass} to="/sandbox">Песочница</NavLink>
          <NavLink className={navClass} to="/theory">Помощь</NavLink>
        </nav>
        
        {/* Mobile Navigation */}
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Открыть меню</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Навигация</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-2 mt-6">
              <NavLink 
                className={mobileNavClass} 
                to="/tasks"
                onClick={() => setIsMenuOpen(false)}
              >
                Задачи
              </NavLink>
              <NavLink 
                className={mobileNavClass} 
                to="/sandbox"
                onClick={() => setIsMenuOpen(false)}
              >
                Песочница
              </NavLink>
              <NavLink 
                className={mobileNavClass} 
                to="/theory"
                onClick={() => setIsMenuOpen(false)}
              >
                Помощь
              </NavLink>
              <div className="border-t pt-4 mt-4">
                <div className="text-primary font-medium mb-3 px-4">Очки: {totalScore}/{maxPossibleScore}</div>
                <Button 
                  variant="secondary" 
                  onClick={resetProgress}
                  className="w-full"
                >
                  Сброс прогресса
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        
        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <div className="text-primary font-medium">Очки: {totalScore}/{maxPossibleScore}</div>
          <Button variant="secondary" onClick={resetProgress}>Сброс прогресса</Button>
        </div>
      </div>
    </header>
  );
}
