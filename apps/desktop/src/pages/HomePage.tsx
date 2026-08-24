import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Plus, LogOut, User, Users, Video, Layers } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageToggle } from '@/components/ui/language-toggle';

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  participants: number;
  status: 'Scheduled' | 'Completed' | 'In Progress';
  platform: string;
}

export function HomePage() {
  const { user, logout } = useAuth();
  const { t } = useTranslation(['home', 'common']);
  const navigate = useNavigate();

  const [meetings, setMeetings] = useState<Meeting[]>([
    {
      id: 'mtg-1',
      title: 'Синхронізація XML каталогів — Розетка & Пром',
      date: '2026-08-25',
      time: '11:00 - 11:45',
      participants: 4,
      status: 'Scheduled',
      platform: 'Google Meet',
    },
    {
      id: 'mtg-2',
      title: 'AI Enrichment — Огляд згенерованих описів',
      date: '2026-08-25',
      time: '14:30 - 15:15',
      participants: 3,
      status: 'Scheduled',
      platform: 'Zoom',
    },
    {
      id: 'mtg-3',
      title: 'Безпека ключів API & OS Keychain дебаг',
      date: '2026-08-24',
      time: '16:00 - 16:30',
      participants: 2,
      status: 'Completed',
      platform: 'Slack Huddle',
    },
  ]);

  const [totalMeetingsCount, setTotalMeetingsCount] = useState<number>(3);

  const handleLogout = () => {
    logout();
    navigate('/auth/login', { replace: true });
  };

  const handleCreateMeeting = () => {
    const newId = `mtg-${Date.now()}`;
    const nextNumber = totalMeetingsCount + 1;
    const newMeeting: Meeting = {
      id: newId,
      title: t('newMeetingDefaultTitle', { number: nextNumber }),
      date: new Date().toISOString().split('T')[0],
      time: '12:00 - 12:30',
      participants: 2,
      status: 'Scheduled',
      platform: 'Google Meet',
    };

    setMeetings((prev) => [newMeeting, ...prev.slice(0, 2)]);
    setTotalMeetingsCount((prev) => prev + 1);
  };

  const latestMeetings = meetings.slice(0, 3);

  return (
    <div
      data-testid="home-page"
      className="min-h-screen w-full flex flex-col bg-background text-foreground"
    >
      {/* Top Header Navigation Bar */}
      <header
        data-testid="home-header"
        className="border-b border-border bg-background/95 backdrop-blur px-6 flex h-14 items-center justify-between sticky top-0 z-10"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Layers className="size-4" />
          </div>
          <span className="font-semibold text-sm">{t('appName')}</span>
        </div>

        <div className="flex items-center gap-3">
          <div
            data-testid="user-profile-badge"
            className="flex items-center gap-2 px-2.5 py-1 rounded-md border border-border text-xs text-muted-foreground bg-muted/40"
          >
            <User className="size-3.5 text-foreground" />
            <span
              data-testid="user-email"
              className="font-medium text-foreground max-w-[200px] truncate"
            >
              {user?.email || 'user@smartfeed.studio'}
            </span>
          </div>

          <LanguageToggle />
          <ThemeToggle />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            data-testid="logout-button"
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-3.5" />
            <span>{t('logout')}</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10 space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{t('dashboardTitle')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('welcomeBack', { name: user?.fullName || user?.email || 'User' })}
            </p>
          </div>

          <Button
            onClick={handleCreateMeeting}
            data-testid="create-meeting-button"
            className="gap-2 self-start sm:self-auto"
          >
            <Plus className="size-4" />
            <span>{t('createMeeting')}</span>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card data-testid="meetings-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalMeetingsTitle')}</CardTitle>
              <Calendar className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div data-testid="meetings-count" className="text-2xl font-bold">
                {totalMeetingsCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('meetingsTrend')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('sessionStatusTitle')}</CardTitle>
              <div className="size-2 rounded-full bg-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{t('sessionActive')}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('userRole', { role: user?.role || 'USER' })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('platformTitle')}</CardTitle>
              <Video className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{t('platformValue')}</div>
              <p className="text-xs text-muted-foreground mt-1">{t('platformSync')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Latest Meetings Section */}
        <Card data-testid="latest-meetings-section">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">{t('latestMeetingsTitle')}</CardTitle>
              <CardDescription className="text-xs">{t('latestMeetingsDesc')}</CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              {t('showingCount', { current: latestMeetings.length, total: totalMeetingsCount })}
            </Badge>
          </CardHeader>

          <CardContent>
            <div data-testid="meetings-list" className="divide-y divide-border">
              {latestMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  data-testid="meeting-item"
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 first:pt-0 last:pb-0 gap-2"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-sm text-foreground">{meeting.title}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3.5" />
                        {meeting.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5" />
                        {meeting.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="size-3.5" />
                        {t('participantsCount', { count: meeting.participants })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {meeting.platform}
                    </span>
                    <Badge
                      variant={
                        meeting.status === 'Completed'
                          ? 'secondary'
                          : meeting.status === 'In Progress'
                            ? 'default'
                            : 'outline'
                      }
                      className="text-xs"
                    >
                      {meeting.status === 'Completed'
                        ? t('statusCompleted')
                        : meeting.status === 'In Progress'
                          ? t('statusInProgress')
                          : t('statusScheduled')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
