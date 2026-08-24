'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Compass,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  LayoutDashboard,
  Layers,
  Sparkles,
  Cloud,
  Settings,
  BarChart3,
  Database,
  KeyRound,
  Bell,
  Shield,
  Users,
  Check,
  AlertCircle,
  Loader2,
  Monitor,
  Crown,
} from 'lucide-react';
import {
  NavigationItemDto,
  CreateNavigationItemDto,
  UpdateNavigationItemDto,
  Role,
  PlanType,
  TargetApp,
} from '@smartfeed/shared';
import { api } from '../../../lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { cn } from '../../../lib/utils';

const AVAILABLE_ICONS = [
  { name: 'LayoutDashboard', icon: LayoutDashboard, label: 'Дашборд' },
  { name: 'Layers', icon: Layers, label: 'Каталоги / Шари' },
  { name: 'Sparkles', icon: Sparkles, label: 'AI Збагачення' },
  { name: 'Cloud', icon: Cloud, label: 'Хмара / Синхронізація' },
  { name: 'Settings', icon: Settings, label: 'Налаштування' },
  { name: 'BarChart3', icon: BarChart3, label: 'Аналітика' },
  { name: 'Database', icon: Database, label: 'База даних' },
  { name: 'KeyRound', icon: KeyRound, label: 'Ліцензії' },
  { name: 'Users', icon: Users, label: 'Користувачі' },
  { name: 'Shield', icon: Shield, label: 'Безпека' },
  { name: 'Bell', icon: Bell, label: 'Сповіщення' },
];

function getIconComponent(iconName: string) {
  const found = AVAILABLE_ICONS.find((i) => i.name === iconName);
  if (found) {
    const Icon = found.icon;
    return <Icon className="h-4 w-4" />;
  }
  return <LayoutDashboard className="h-4 w-4" />;
}

export default function NavigationManagementPage() {
  const [items, setItems] = useState<NavigationItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppFilter, setSelectedAppFilter] = useState<TargetApp | 'ALL_FILTER'>(
    'ALL_FILTER',
  );

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NavigationItemDto | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formKey, setFormKey] = useState('');
  const [formLabelUk, setFormLabelUk] = useState('');
  const [formLabelEn, setFormLabelEn] = useState('');
  const [formPath, setFormPath] = useState('');
  const [formIcon, setFormIcon] = useState('LayoutDashboard');
  const [formTargetApp, setFormTargetApp] = useState<TargetApp>(TargetApp.DESKTOP);
  const [formRequiredRoles, setFormRequiredRoles] = useState<Role[]>([
    Role.USER,
    Role.ADMIN,
    Role.SUPER_ADMIN,
  ]);
  const [formRequiredPlan, setFormRequiredPlan] = useState<string>('NONE');
  const [formIsVisible, setFormIsVisible] = useState(true);

  // Live Preview Role/Plan state
  const [previewPlan, setPreviewPlan] = useState<PlanType | 'ALL'>(PlanType.FREE);

  const fetchItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getAdminNavigationItems();
      setItems(data);
    } catch (err: any) {
      setError(err?.message || 'Не вдалося завантажити пункти меню');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleOpenAddDialog = () => {
    setEditingItem(null);
    setFormKey('');
    setFormLabelUk('');
    setFormLabelEn('');
    setFormPath('');
    setFormIcon('LayoutDashboard');
    setFormTargetApp(TargetApp.DESKTOP);
    setFormRequiredRoles([Role.USER, Role.ADMIN, Role.SUPER_ADMIN]);
    setFormRequiredPlan('NONE');
    setFormIsVisible(true);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (item: NavigationItemDto) => {
    setEditingItem(item);
    setFormKey(item.key);
    setFormLabelUk(item.labelUk);
    setFormLabelEn(item.labelEn);
    setFormPath(item.path);
    setFormIcon(item.icon || 'LayoutDashboard');
    setFormTargetApp(item.targetApp);
    setFormRequiredRoles(item.requiredRoles);
    setFormRequiredPlan(item.requiredPlan || 'NONE');
    setFormIsVisible(item.isVisible);
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const planValue = formRequiredPlan === 'NONE' ? null : (formRequiredPlan as PlanType);

      if (editingItem) {
        const updatePayload: UpdateNavigationItemDto = {
          key: formKey,
          labelUk: formLabelUk,
          labelEn: formLabelEn,
          path: formPath,
          icon: formIcon,
          targetApp: formTargetApp,
          requiredRoles: formRequiredRoles,
          requiredPlan: planValue,
          isVisible: formIsVisible,
        };
        await api.updateNavigationItem(editingItem.id, updatePayload);
      } else {
        const createPayload: CreateNavigationItemDto = {
          key: formKey,
          labelUk: formLabelUk,
          labelEn: formLabelEn,
          path: formPath,
          icon: formIcon,
          order: items.length + 1,
          targetApp: formTargetApp,
          requiredRoles: formRequiredRoles,
          requiredPlan: planValue,
          isVisible: formIsVisible,
        };
        await api.createNavigationItem(createPayload);
      }

      setDialogOpen(false);
      await fetchItems();
    } catch (err: any) {
      setError(err?.message || 'Помилка збереження');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Ви впевнені, що бажаєте видалити пункт "${label}"?`)) return;
    try {
      await api.deleteNavigationItem(id);
      await fetchItems();
    } catch (err: any) {
      alert(`Не вдалося видалити: ${err?.message}`);
    }
  };

  const handleToggleVisibility = async (item: NavigationItemDto) => {
    try {
      await api.updateNavigationItem(item.id, { isVisible: !item.isVisible });
      await fetchItems();
    } catch (err: any) {
      alert(`Не вдалося змінити видимість: ${err?.message}`);
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    const payload = {
      items: newItems.map((item, idx) => ({
        id: item.id,
        order: idx + 1,
      })),
    };

    try {
      setItems(newItems);
      await api.reorderNavigationItems(payload);
    } catch (err: any) {
      alert(`Не вдалося змінити порядок: ${err?.message}`);
      await fetchItems();
    }
  };

  const toggleRole = (role: Role) => {
    if (formRequiredRoles.includes(role)) {
      if (formRequiredRoles.length === 1) return; // keep at least one
      setFormRequiredRoles(formRequiredRoles.filter((r) => r !== role));
    } else {
      setFormRequiredRoles([...formRequiredRoles, role]);
    }
  };

  const filteredItems = items.filter((item) => {
    if (selectedAppFilter === 'ALL_FILTER') return true;
    return item.targetApp === selectedAppFilter || item.targetApp === TargetApp.ALL;
  });

  // Calculate live preview visibility
  const previewItems = items
    .filter(
      (item) =>
        item.isVisible &&
        (item.targetApp === TargetApp.DESKTOP || item.targetApp === TargetApp.ALL),
    )
    .filter((item) => {
      if (previewPlan === 'ALL') return true;
      if (!item.requiredPlan) return true;
      if (item.requiredPlan === PlanType.FREE) return true;
      if (
        item.requiredPlan === PlanType.PRO &&
        (previewPlan === PlanType.PRO || previewPlan === PlanType.ENTERPRISE)
      )
        return true;
      if (item.requiredPlan === PlanType.ENTERPRISE && previewPlan === PlanType.ENTERPRISE)
        return true;
      return false;
    });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/20">
              <Compass className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Навігація & Система доступів
              </h1>
              <p className="text-sm text-muted-foreground">
                Керування структурою динамічного меню користувача, зміна назв та налаштування прав
                за тарифами
              </p>
            </div>
          </div>
        </div>

        <Button onClick={handleOpenAddDialog} className="shadow-md shadow-primary/25 gap-2">
          <Plus className="h-4 w-4" />
          <span>Додати пункт меню</span>
        </Button>
      </div>

      {error && (
        <div className="flex items-center space-x-2 rounded-xl bg-destructive/15 p-4 text-sm text-destructive border border-destructive/30">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Management Table + Live Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left 2 Cols: Table & Filter */}
        <div className="xl:col-span-2 space-y-4">
          <Card className="border-border/80 bg-card/60 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Пункти меню у базі даних</CardTitle>
                <CardDescription className="text-xs">
                  Налаштовуйте порядок, назви (UK/EN) та тарифні обмеження
                </CardDescription>
              </div>

              {/* Filter by Target App */}
              <div className="flex items-center space-x-1 bg-secondary/50 p-1 rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => setSelectedAppFilter('ALL_FILTER')}
                  className={cn(
                    'px-2.5 py-1 text-xs rounded-lg font-medium transition-all',
                    selectedAppFilter === 'ALL_FILTER'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  Всі ({items.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAppFilter(TargetApp.DESKTOP)}
                  className={cn(
                    'px-2.5 py-1 text-xs rounded-lg font-medium transition-all',
                    selectedAppFilter === TargetApp.DESKTOP
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAppFilter(TargetApp.ADMIN_PORTAL)}
                  className={cn(
                    'px-2.5 py-1 text-xs rounded-lg font-medium transition-all',
                    selectedAppFilter === TargetApp.ADMIN_PORTAL
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  Admin
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center p-12 text-muted-foreground space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Завантаження пунктів...</span>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center p-12 text-muted-foreground text-sm">
                  Немає пунктів меню. Створіть перший пункт за допомогою кнопки вище.
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {filteredItems.map((item, index) => (
                    <div
                      key={item.id}
                      className={cn(
                        'flex items-center justify-between p-4 transition-colors hover:bg-muted/30 gap-3',
                        !item.isVisible && 'opacity-60 bg-muted/10',
                      )}
                    >
                      {/* Left: Reorder & Icon & Labels */}
                      <div className="flex items-center space-x-3 min-w-0">
                        {/* Order buttons */}
                        <div className="flex flex-col space-y-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveOrder(index, 'up')}
                            disabled={index === 0}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30"
                            title="Вгору"
                          >
                            <MoveUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveOrder(index, 'down')}
                            disabled={index === items.length - 1}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30"
                            title="Вниз"
                          >
                            <MoveDown className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Icon badge */}
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                          {getIconComponent(item.icon)}
                        </div>

                        {/* Text labels */}
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-sm text-foreground truncate">
                              {item.labelUk}
                            </span>
                            <span className="text-xs text-muted-foreground">/ {item.labelEn}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground font-mono">
                            <span>{item.path}</span>
                            <span>&bull;</span>
                            <span className="text-[11px] text-muted-foreground/70">
                              key: {item.key}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Badges & Controls */}
                      <div className="flex items-center space-x-3 shrink-0">
                        {/* Plan requirement */}
                        {item.requiredPlan ? (
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] px-2 font-semibold',
                              item.requiredPlan === PlanType.ENTERPRISE
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-purple-500/10 text-purple-400 border-purple-500/30',
                            )}
                          >
                            <Crown className="h-3 w-3 mr-1" />
                            {item.requiredPlan}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] px-2">
                            FREE+
                          </Badge>
                        )}

                        {/* Visibility Toggle Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            'h-8 w-8 p-0 rounded-lg',
                            item.isVisible
                              ? 'text-emerald-400 hover:bg-emerald-500/10'
                              : 'text-muted-foreground hover:bg-muted',
                          )}
                          onClick={() => handleToggleVisibility(item)}
                          title={
                            item.isVisible
                              ? 'Активний (клікніть щоб приховати)'
                              : 'Прихований (клікніть щоб увімкнути)'
                          }
                        >
                          {item.isVisible ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>

                        {/* Edit Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 border-border hover:bg-muted rounded-lg"
                          onClick={() => handleOpenEditDialog(item)}
                          title="Редагувати"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>

                        {/* Delete Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 border-border hover:bg-destructive/15 hover:text-destructive hover:border-destructive/30 rounded-lg"
                          onClick={() => handleDelete(item.id, item.labelUk)}
                          title="Видалити"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Live Preview Simulator */}
        <div className="space-y-4">
          <Card className="border-border/80 bg-card/60 backdrop-blur-md sticky top-24">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Monitor className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Симулятор вигляду меню</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Перевірте, які пункти бачить користувач з різними тарифами
              </CardDescription>

              {/* Plan Switcher */}
              <div className="grid grid-cols-3 gap-1 pt-2">
                {[
                  { plan: PlanType.FREE, label: 'Free Plan' },
                  { plan: PlanType.PRO, label: 'PRO Plan' },
                  { plan: PlanType.ENTERPRISE, label: 'Enterprise' },
                ].map((p) => (
                  <button
                    key={p.plan}
                    type="button"
                    onClick={() => setPreviewPlan(p.plan)}
                    className={cn(
                      'px-2 py-1.5 text-xs font-semibold rounded-lg border transition-all text-center',
                      previewPlan === p.plan
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'border-border bg-secondary/30 text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="pt-2">
              <div className="rounded-xl border border-border/80 bg-background/80 p-3 shadow-inner space-y-2">
                <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Меню користувача ({previewPlan})
                </div>

                <div className="space-y-1">
                  {previewItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-card/80 border border-border/50 text-xs font-medium"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="text-primary">{getIconComponent(item.icon)}</div>
                        <span className="text-foreground">{item.labelUk}</span>
                      </div>
                      {item.requiredPlan && (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1.5 py-0 border-primary/30 text-primary"
                        >
                          {item.requiredPlan}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-muted-foreground text-center pt-2 border-t border-border/40">
                  Доступно {previewItems.length} з{' '}
                  {items.filter((i) => i.targetApp !== TargetApp.ADMIN_PORTAL).length} пунктів
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Редагувати пункт меню' : 'Додати новий пункт меню'}
            </DialogTitle>
            <DialogDescription>
              Налаштуйте назви, іконку, шлях та тарифні права доступу
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="labelUk">Назва (UA) *</Label>
                <Input
                  id="labelUk"
                  placeholder="напр. Каталоги"
                  value={formLabelUk}
                  onChange={(e) => setFormLabelUk(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="labelEn">Назва (EN) *</Label>
                <Input
                  id="labelEn"
                  placeholder="e.g. Catalogs"
                  value={formLabelEn}
                  onChange={(e) => setFormLabelEn(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="key">Унікальний Key *</Label>
                <Input
                  id="key"
                  placeholder="catalogs_feed"
                  value={formKey}
                  onChange={(e) => setFormKey(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="path">Маршрут (Path) *</Label>
                <Input
                  id="path"
                  placeholder="/catalogs"
                  value={formPath}
                  onChange={(e) => setFormPath(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Icon Picker */}
            <div className="space-y-1.5">
              <Label>Іконка розділу</Label>
              <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1.5 border border-border rounded-xl bg-secondary/20">
                {AVAILABLE_ICONS.map((ic) => {
                  const Icon = ic.icon;
                  const isSelected = formIcon === ic.name;
                  return (
                    <button
                      key={ic.name}
                      type="button"
                      onClick={() => setFormIcon(ic.name)}
                      className={cn(
                        'flex flex-col items-center justify-center p-2 rounded-lg border text-xs gap-1 transition-all',
                        isSelected
                          ? 'bg-primary/20 text-primary border-primary font-semibold shadow-sm'
                          : 'border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[10px] truncate max-w-full">{ic.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Required Plan & App */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="plan">Вимога тарифного плану</Label>
                <select
                  id="plan"
                  value={formRequiredPlan}
                  onChange={(e) => setFormRequiredPlan(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="NONE">Всі тарифи (FREE+)</option>
                  <option value={PlanType.PRO}>PRO та Enterprise</option>
                  <option value={PlanType.ENTERPRISE}>Тільки Enterprise</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="targetApp">Цільовий додаток</Label>
                <select
                  id="targetApp"
                  value={formTargetApp}
                  onChange={(e) => setFormTargetApp(e.target.value as TargetApp)}
                  className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value={TargetApp.DESKTOP}>Десктоп клієнт (Desktop)</option>
                  <option value={TargetApp.ADMIN_PORTAL}>Панель адміна (Admin)</option>
                  <option value={TargetApp.ALL}>Всюди (All)</option>
                </select>
              </div>
            </div>

            {/* Role Access Checkboxes */}
            <div className="space-y-1.5">
              <Label>Дозволені ролі користувачів</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {[Role.USER, Role.ADMIN, Role.SUPER_ADMIN].map((role) => {
                  const checked = formRequiredRoles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all',
                        checked
                          ? 'bg-primary/15 text-primary border-primary/50'
                          : 'border-border text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <div
                        className={cn(
                          'w-3.5 h-3.5 rounded border flex items-center justify-center',
                          checked
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-muted-foreground',
                        )}
                      >
                        {checked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span>{role}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Visibility Toggle */}
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="isVisible"
                checked={formIsVisible}
                onChange={(e) => setFormIsVisible(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <Label htmlFor="isVisible" className="cursor-pointer text-xs">
                Пункт активний та видимий у меню
              </Label>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSaving}
              >
                Скасувати
              </Button>
              <Button type="submit" disabled={isSaving} className="gap-1.5">
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{editingItem ? 'Зберегти зміни' : 'Створити пункт'}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
