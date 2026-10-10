import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Sparkles,
  Cloud,
  Settings,
  BarChart3,
  Database,
  KeyRound,
  Users,
  Shield,
  Bell,
  Compass,
  Receipt,
  CreditCard,
  FileText,
  LucideIcon,
} from 'lucide-react';

export interface IconOption {
  name: string;
  icon: LucideIcon;
  label: string;
}

export const AVAILABLE_ICONS: IconOption[] = [
  { name: 'LayoutDashboard', icon: LayoutDashboard, label: 'Дашборд / Dashboard' },
  { name: 'Layers', icon: Layers, label: 'Каталоги / Catalogs' },
  { name: 'Sparkles', icon: Sparkles, label: 'AI Асистент / AI Assistant' },
  { name: 'Cloud', icon: Cloud, label: 'Хмара / Cloud Sync' },
  { name: 'Settings', icon: Settings, label: 'Налаштування / Settings' },
  { name: 'BarChart3', icon: BarChart3, label: 'Аналітика / Analytics' },
  { name: 'Database', icon: Database, label: 'База даних / Database' },
  { name: 'KeyRound', icon: KeyRound, label: 'Ліцензії / Licenses' },
  { name: 'Users', icon: Users, label: 'Користувачі / Users' },
  { name: 'Receipt', icon: Receipt, label: 'Транзакції / Transactions' },
  { name: 'CreditCard', icon: CreditCard, label: 'Платіжні системи / Payments' },
  { name: 'Shield', icon: Shield, label: 'Безпека / Security' },
  { name: 'Bell', icon: Bell, label: 'Сповіщення / Notifications' },
  { name: 'Compass', icon: Compass, label: 'Навігація / Navigation' },
  { name: 'FileText', icon: FileText, label: 'Документи / Documents' },
];

export function getLucideIcon(iconName: string): LucideIcon {
  const found = AVAILABLE_ICONS.find((i) => i.name === iconName);
  return found ? found.icon : LayoutDashboard;
}

export function getIconComponent(iconName: string): React.ReactElement {
  const Icon = getLucideIcon(iconName);
  return <Icon className="h-4 w-4" />;
}
