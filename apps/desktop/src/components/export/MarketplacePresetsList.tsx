import React from 'react';
import { Label } from '@/components/ui/label';
import { FeedFormat } from '@smartfeed/shared';

export interface MarketplacePreset {
  code: string;
  name: string;
  defaultFormat: FeedFormat;
  defaultCommission: number;
}

export const MARKETPLACES: MarketplacePreset[] = [
  {
    code: 'ROZETKA',
    name: 'Rozetka (XML / YML)',
    defaultFormat: FeedFormat.XML_ROZETKA,
    defaultCommission: 15,
  },
  {
    code: 'PROM',
    name: 'Prom.ua (YML)',
    defaultFormat: FeedFormat.YML_PROM,
    defaultCommission: 12,
  },
  {
    code: 'EPICENTR',
    name: 'Epicentr (XML)',
    defaultFormat: FeedFormat.XML_ROZETKA,
    defaultCommission: 15,
  },
  {
    code: 'HOTLINE',
    name: 'Hotline (CSV / XML)',
    defaultFormat: FeedFormat.CSV,
    defaultCommission: 8,
  },
  {
    code: 'OTHER',
    name: 'Інший маркетплейс / формат',
    defaultFormat: FeedFormat.XML_GENERIC,
    defaultCommission: 10,
  },
];

interface MarketplacePresetsListProps {
  selectedCode: string;
  onSelect: (code: string) => void;
}

export const MarketplacePresetsList: React.FC<MarketplacePresetsListProps> = ({
  selectedCode,
  onSelect,
}) => {
  return (
    <div>
      <Label className="text-xs text-foreground font-semibold">Оберіть маркетплейс</Label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5">
        {MARKETPLACES.map((m) => {
          const isSelected = selectedCode === m.code;
          return (
            <button
              key={m.code}
              type="button"
              onClick={() => onSelect(m.code)}
              className={`p-2.5 rounded-xl border text-left transition-all text-xs flex flex-col justify-between gap-1.5 ${
                isSelected
                  ? 'border-primary bg-primary/10 text-primary font-semibold shadow-xs ring-1 ring-primary'
                  : 'border-border/80 bg-background text-muted-foreground hover:text-foreground hover:border-primary/40'
              }`}
            >
              <span className="truncate">{m.name}</span>
              <span className="text-[10px] opacity-75 font-mono">
                Комісія ~{m.defaultCommission}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
