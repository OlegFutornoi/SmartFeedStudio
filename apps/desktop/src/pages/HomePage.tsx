import { useState } from 'react';
import { Calendar, Clock, Plus, Video, Sparkles, Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
  const { user } = useAuth();
  const { t } = useTranslation(['home', 'common']);

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
      className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300"
    >
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t('dashboardTitle')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('welcomeBack', { name: user?.fullName || user?.email || 'User' })}
          </p>
        </div>

        <Button
          onClick={handleCreateMeeting}
          data-testid="create-meeting-button"
          className="gap-2 shadow-md shadow-primary/25 self-start sm:self-auto"
        >
          <Plus className="size-4" />
          <span>{t('createMeeting')}</span>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          data-testid="meetings-card"
          className="border-border/80 bg-card/60 backdrop-blur-md shadow-sm hover:shadow-md transition-shadow"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalMeetingsTitle')}</CardTitle>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Calendar className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div
              data-testid="meetings-count"
              className="text-3xl font-bold tracking-tight text-foreground"
            >
              {totalMeetingsCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('meetingsTrend')}</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/60 backdrop-blur-md shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('sessionStatusTitle')}</CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Activity className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>{t('sessionActive')}</span>
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('userRole', { role: user?.role || 'USER' })}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/60 backdrop-blur-md shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('platformTitle')}</CardTitle>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Sparkles className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {t('platformValue')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('platformSync')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Latest Meetings Section */}
      <Card
        data-testid="latest-meetings-section"
        className="border-border/80 bg-card/60 backdrop-blur-md shadow-sm"
      >
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-base font-semibold text-foreground">
              {t('latestMeetingsTitle')}
            </CardTitle>
            <CardDescription className="text-xs">{t('latestMeetingsDesc')}</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
            {t('showingCount', { current: latestMeetings.length, total: totalMeetingsCount })}
          </Badge>
        </CardHeader>

        <CardContent>
          <div data-testid="meetings-list" className="divide-y divide-border/60">
            {latestMeetings.map((meeting) => (
              <div
                key={meeting.id}
                data-testid="meeting-item"
                className="flex flex-col sm:flex-row sm:items-center justify-between py-4 first:pt-0 last:pb-0 gap-3 hover:bg-muted/20 px-2 rounded-xl transition-colors"
              >
                <div className="space-y-1">
                  <p className="font-medium text-sm text-foreground">{meeting.title}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-primary" />
                      {meeting.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      {meeting.time}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Video className="size-3.5" />
                      {meeting.platform}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
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
    </div>
  );
}
