import { Settings, User, Shield, Moon, Sun, Globe, Check, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, type AccentColor } from '@/contexts/ThemeContext';
import { useTranslation } from '@/i18n';

export function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();
  const { language, setLanguage } = useTranslation();
  const isUk = language === 'uk';

  const colorThemes: Array<{ id: AccentColor; labelUk: string; labelEn: string; color: string }> = [
    {
      id: 'emerald',
      labelUk: 'Смарагдовий (За замовчуванням)',
      labelEn: 'Emerald (Default)',
      color: '#10b981',
    },
    { id: 'blue', labelUk: 'Океанічний Синій', labelEn: 'Ocean Blue', color: '#3b82f6' },
    { id: 'violet', labelUk: 'Фіолетовий Неон', labelEn: 'Violet Neon', color: '#8b5cf6' },
    { id: 'amber', labelUk: 'Бурштиновий', labelEn: 'Warm Amber', color: '#f59e0b' },
  ];

  return (
    <div
      data-testid="settings-page"
      className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300"
    >
      {/* Header */}
      <div className="flex items-center space-x-3 pb-2 border-b border-border/40">
        <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/20">
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {isUk ? 'Налаштування системи' : 'Settings & Preferences'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isUk
              ? 'Персоналізація інтерфейсу, теми оформлення та параметри безпеки'
              : 'Customize interface appearance, color scheme, and security options'}
          </p>
        </div>
      </div>

      {/* Account Info Card */}
      <Card className="border-border/80 bg-card/60 backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">
              {isUk ? 'Профіль користувача' : 'User Profile'}
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            {isUk
              ? 'Дані поточного сеансу та рівень доступу'
              : 'Session credentials and access permissions'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl border border-border/60 bg-secondary/20">
              <span className="text-xs text-muted-foreground block">
                {isUk ? 'Повне ім’я' : 'Full Name'}
              </span>
              <span className="text-sm font-semibold text-foreground">
                {user?.fullName || 'Client User'}
              </span>
            </div>
            <div className="p-3.5 rounded-xl border border-border/60 bg-secondary/20">
              <span className="text-xs text-muted-foreground block">Email</span>
              <span className="text-sm font-semibold text-foreground font-mono">{user?.email}</span>
            </div>
            <div className="p-3.5 rounded-xl border border-border/60 bg-secondary/20">
              <span className="text-xs text-muted-foreground block">
                {isUk ? 'Роль в системі' : 'Role'}
              </span>
              <Badge variant="outline" className="mt-1 font-mono text-xs">
                {user?.role}
              </Badge>
            </div>
            <div className="p-3.5 rounded-xl border border-border/60 bg-secondary/20">
              <span className="text-xs text-muted-foreground block">
                {isUk ? 'Безпека ключів' : 'Key Security'}
              </span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 mt-1">
                <Shield className="h-3.5 w-3.5" />
                <span>OS Keychain Active</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance & Color Scheme Card */}
      <Card className="border-border/80 bg-card/60 backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Palette className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">
              {isUk ? 'Тема оформлення та кольорова схема' : 'Appearance & Themes'}
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            {isUk
              ? 'Налаштування зберігаються локально на вашому пристрої'
              : 'Settings are preserved locally on your device'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mode Switcher */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">
              {isUk ? 'Режим підсвічування' : 'Light / Dark Mode'}
            </label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => setTheme('dark')}
                className="gap-2 text-xs h-9"
              >
                <Moon className="h-4 w-4" />
                <span>{isUk ? 'Темна тема' : 'Dark Theme'}</span>
              </Button>
              <Button
                type="button"
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => setTheme('light')}
                className="gap-2 text-xs h-9"
              >
                <Sun className="h-4 w-4" />
                <span>{isUk ? 'Світла тема' : 'Light Theme'}</span>
              </Button>
            </div>
          </div>

          {/* Color Schemes */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">
              {isUk ? 'Акцентний колір бренду' : 'Accent Brand Color'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {colorThemes.map((scheme) => {
                const isSelected = (accentColor || 'emerald') === scheme.id;
                return (
                  <button
                    key={scheme.id}
                    type="button"
                    onClick={() => setAccentColor(scheme.id)}
                    className={`flex items-center space-x-2.5 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-foreground ring-2 ring-primary/40'
                        : 'border-border/60 hover:bg-muted/40 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span
                      className="h-4 w-4 rounded-full shrink-0 border border-white/20"
                      style={{ backgroundColor: scheme.color }}
                    />
                    <span className="truncate">
                      {isUk ? scheme.labelUk.split(' ')[0] : scheme.labelEn.split(' ')[0]}
                    </span>
                    {isSelected && <Check className="h-3.5 w-3.5 ml-auto text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language Switcher */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">
              {isUk ? 'Мова інтерфейсу' : 'Interface Language'}
            </label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant={language === 'uk' ? 'default' : 'outline'}
                onClick={() => setLanguage('uk')}
                className="gap-2 text-xs h-9"
              >
                <Globe className="h-4 w-4" />
                <span>Українська (UA)</span>
              </Button>
              <Button
                type="button"
                variant={language === 'en' ? 'default' : 'outline'}
                onClick={() => setLanguage('en')}
                className="gap-2 text-xs h-9"
              >
                <Globe className="h-4 w-4" />
                <span>English (EN)</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
