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
} from 'lucide-react';

export interface IconOption {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

export const AVAILABLE_ICONS: IconOption[] = [
  { name: 'LayoutDashboard', icon: LayoutDashboard, label: 'Дашборд / Dashboard' },
  { name: 'Layers', icon: Layers, label: 'Каталоги / Catalogs' },
  { name: 'Sparkles', icon: Sparkles, label: 'AI Збагачення / AI Enrichment' },
  { name: 'Cloud', icon: Cloud, label: 'Хмара / Cloud Sync' },
  { name: 'Settings', icon: Settings, label: 'Налаштування / Settings' },
  { name: 'BarChart3', icon: BarChart3, label: 'Аналітика / Analytics' },
  { name: 'Database', icon: Database, label: 'База даних / Database' },
  { name: 'KeyRound', icon: KeyRound, label: 'Ліцензії / Licenses' },
  { name: 'Users', icon: Users, label: 'Користувачі / Users' },
  { name: 'Shield', icon: Shield, label: 'Безпека / Security' },
  { name: 'Bell', icon: Bell, label: 'Сповіщення / Notifications' },
];

export function getIconComponent(iconName: string): React.ReactElement {
  const found = AVAILABLE_ICONS.find((i) => i.name === iconName);
  if (found) {
    const Icon = found.icon;
    return <Icon className="h-4 w-4" />;
  }
  return <LayoutDashboard className="h-4 w-4" />;
}
