import { useState, useEffect, useCallback, useRef } from 'react';
import { Store, Plus, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ExportChannelDto,
  CreateExportChannelDto,
  UpdateExportChannelDto,
} from '@smartfeed/shared';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import {
  getExportChannels,
  createExportChannel,
  updateExportChannel,
  deleteExportChannel,
} from '@/lib/api';
import { ExportChannelCard } from './ExportChannelCard';
import { CreateExportChannelDialog } from './CreateExportChannelDialog';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';

interface ExportChannelsListProps {
  catalogs?: Array<{ id: string; name: string }>;
}

export function ExportChannelsList({ catalogs = [] }: ExportChannelsListProps) {
  const { language } = useTranslation(['catalogs', 'common']);
  const isUk = language === 'uk';
  const { token, isAuthenticated } = useAuth();

  const [channels, setChannels] = useState<ExportChannelDto[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<ExportChannelDto | null>(null);
  const [channelToDelete, setChannelToDelete] = useState<ExportChannelDto | null>(null);

  const lastFetchedTokenRef = useRef<string | null>(null);
  const isFetchingRef = useRef<boolean>(false);

  const fetchChannels = useCallback(
    async (force = false, silent = false) => {
      if (!token || !isAuthenticated) return;
      if (!force && lastFetchedTokenRef.current === token) return;
      if (isFetchingRef.current) return;

      try {
        isFetchingRef.current = true;
        if (!silent) setIsLoading(true);
        const data = await getExportChannels({ search }, token);
        lastFetchedTokenRef.current = token;
        setChannels(data);
      } catch (err) {
        console.error('Failed to fetch export channels:', err);
      } finally {
        if (!silent) setIsLoading(false);
        isFetchingRef.current = false;
      }
    },
    [token, isAuthenticated, search],
  );

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const handleSaveChannel = async (dto: CreateExportChannelDto) => {
    if (!token) return;
    if (editingChannel) {
      const updated = await updateExportChannel(
        editingChannel.id,
        dto as UpdateExportChannelDto,
        token,
      );
      setChannels((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setEditingChannel(null);
    } else {
      const created = await createExportChannel(dto, token);
      setChannels((prev) => [created, ...prev]);
    }
  };

  const handleConfirmDelete = async () => {
    if (!channelToDelete || !token) return;
    try {
      await deleteExportChannel(channelToDelete.id, token);
      setChannels((prev) => prev.filter((c) => c.id !== channelToDelete.id));
      setChannelToDelete(null);
    } catch (err) {
      console.error('Failed to delete export channel:', err);
    }
  };

  const filteredChannels = channels.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.marketplaceCode.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Пошук каналів та маркетплейсів..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-secondary/40 border border-border/80 rounded-xl pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            data-testid="search-export-channels-input"
          />
        </div>

        <Button
          size="sm"
          onClick={() => {
            setEditingChannel(null);
            setIsCreateOpen(true);
          }}
          className="h-8 text-xs gap-1.5 shadow-sm"
          data-testid="create-export-channel-btn"
        >
          <Plus className="size-3.5" />
          Підключити маркетплейс
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-16">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : filteredChannels.length === 0 ? (
        <Card className="p-12 text-center border-border/60 bg-card/40">
          <Store className="size-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-foreground">
            {search ? 'Каналів не знайдено' : 'Немає підключених каналів експорту'}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Створіть свій перший канал експорту для Rozetka, Prom, Epicentr чи Hotline з
            автоматичним розрахунком зворотної націнки
          </p>
          <Button
            size="sm"
            onClick={() => {
              setEditingChannel(null);
              setIsCreateOpen(true);
            }}
            className="mt-4 text-xs"
          >
            <Plus className="size-3.5 mr-1.5" />
            Підключити маркетплейс
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredChannels.map((channel) => (
            <ExportChannelCard
              key={channel.id}
              channel={channel}
              onEdit={(c) => {
                setEditingChannel(c);
                setIsCreateOpen(true);
              }}
              onDelete={(id) => {
                const target = channels.find((c) => c.id === id);
                if (target) setChannelToDelete(target);
              }}
            />
          ))}
        </div>
      )}

      {/* Dialog for Create / Edit Channel */}
      <CreateExportChannelDialog
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingChannel(null);
        }}
        onSave={handleSaveChannel}
        initialData={editingChannel}
        catalogs={catalogs}
      />

      {/* Confirm Delete Channel Dialog */}
      <ConfirmDeleteDialog
        isOpen={Boolean(channelToDelete)}
        onClose={() => setChannelToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={isUk ? 'Видалити канал експорту' : 'Delete Export Channel'}
        description={
          <div className="space-y-2">
            <p>
              {isUk
                ? 'Ви дійсно бажаєте видалити цей канал експорту?'
                : 'Are you sure you want to delete this export channel?'}
            </p>
            {channelToDelete && (
              <div className="p-2.5 rounded-lg bg-muted border border-border font-mono text-[11px] text-foreground font-semibold truncate">
                {channelToDelete.name} ({channelToDelete.marketplaceCode})
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">
              {isUk
                ? 'Публічне посилання на фід стане недоступним для маркетплейсу.'
                : 'The public feed URL will become unavailable for the marketplace.'}
            </p>
          </div>
        }
        confirmLabel={isUk ? 'Видалити канал' : 'Delete channel'}
        cancelLabel={isUk ? 'Скасувати' : 'Cancel'}
      />
    </div>
  );
}
