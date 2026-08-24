import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from './button';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    if (resolvedTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      data-testid="theme-toggle"
      className="h-9 w-9 text-muted-foreground hover:text-foreground"
      aria-label="Toggle Theme"
      title={`Current theme: ${theme} (${resolvedTheme})`}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-4 w-4 transition-all text-amber-400" />
      ) : (
        <Moon className="h-4 w-4 transition-all text-slate-700" />
      )}
    </Button>
  );
}
