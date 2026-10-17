type TFunction = (key: string, params?: Record<string, string | number>) => string;

export type MarketplaceType = 'ROZETKA' | 'PROM' | 'EPICENTR' | 'GOOGLE';

export interface MarketplaceContent {
  photoDesc: string;
  attrDesc: string;
  titleDesc: string;
  tag: string;
}

export function getMarketplaceContent(type: MarketplaceType, t: TFunction): MarketplaceContent {
  switch (type) {
    case 'ROZETKA':
      return {
        photoDesc: t('suppliers:reqPhotoDescRozetka', {
          defaultValue:
            'Суворо білий фон (#FFFFFF), роздільна здатність від 800×800 px, без водяних знаків та телефонів.',
        }),
        attrDesc: t('suppliers:reqAttrDescRozetka', {
          defaultValue:
            "Заповнення обов'язкових параметрів категорії. Без них картка не пройде модерацію.",
        }),
        titleDesc: t('suppliers:reqTitleDescRozetka', {
          defaultValue:
            'Формула «Тип товару + Бренд + Модель». Сувора заборона слів «Хіт/Акція» та контактів.',
        }),
        tag: 'XML / YML Rozetka',
      };
    case 'PROM':
      return {
        photoDesc: t('suppliers:reqPhotoDescProm', {
          defaultValue:
            'Дозволено білий або світло-нейтральний фон, до 10 фото на товар, якісні ракурси.',
        }),
        attrDesc: t('suppliers:reqAttrDescProm', {
          defaultValue:
            'Категорійні атрибути та пошукові теги (keywords) для максимальної видачі у ProSale.',
        }),
        titleDesc: t('suppliers:reqTitleDescProm', {
          defaultValue: "Обов'язкова наявність назви та опису державною українською мовою.",
        }),
        tag: 'YML Prom / Excel',
      };
    case 'EPICENTR':
      return {
        photoDesc: t('suppliers:reqPhotoDescEpicentr', {
          defaultValue:
            'Студійні фотографії високої чіткості, перший кадр строго на чистому білому тлі.',
        }),
        attrDesc: t('suppliers:reqAttrDescEpicentr', {
          defaultValue:
            "Обов'язковий штрихкод EAN-13, точний бренд та код виробника для кожного товару.",
        }),
        titleDesc: t('suppliers:reqTitleDescEpicentr', {
          defaultValue:
            'Чітка назва згідно зі стандартами мережі, точні габарити та вага для логістики.',
        }),
        tag: 'Epicentr XML',
      };
    case 'GOOGLE':
      return {
        photoDesc: t('suppliers:reqPhotoDescGoogle', {
          defaultValue:
            'Чисте фото товару без рекламних плашок, написів «Акція», «Знижка» чи сторонніх рамок.',
        }),
        attrDesc: t('suppliers:reqAttrDescGoogle', {
          defaultValue:
            'Наявність ідентифікаторів GTIN/MPN та точний мапінг у google_product_category.',
        }),
        titleDesc: t('suppliers:reqTitleDescGoogle', {
          defaultValue:
            'Відповідність ціни та наявності у фіді та на сайті без прихованих платежів.',
        }),
        tag: 'Google Merchant Feed',
      };
  }
}

export const MARKETPLACE_TABS: Array<{
  id: MarketplaceType;
  labelKey: string;
  defaultLabel: string;
}> = [
  { id: 'ROZETKA', labelKey: 'suppliers:tabRozetka', defaultLabel: 'Rozetka' },
  { id: 'PROM', labelKey: 'suppliers:tabProm', defaultLabel: 'Prom.ua' },
  { id: 'EPICENTR', labelKey: 'suppliers:tabEpicentr', defaultLabel: 'Епіцентр' },
  { id: 'GOOGLE', labelKey: 'suppliers:tabGoogleShopping', defaultLabel: 'Google Shopping' },
];

export const CHECKLIST_ITEMS: Array<{
  key: 'importDone' | 'attrsChecked' | 'photosChecked' | 'exportReady';
  labelKey: string;
  defaultLabel: string;
}> = [
  {
    key: 'importDone',
    labelKey: 'suppliers:chkImportApplied',
    defaultLabel: 'Імпорт товарів та базової націнки успішно застосовано',
  },
  {
    key: 'attrsChecked',
    labelKey: 'suppliers:chkVerifyAttrs',
    defaultLabel: "Перевірити наявність обов'язкових характеристик для обраної категорії",
  },
  {
    key: 'photosChecked',
    labelKey: 'suppliers:chkVerifyPhotos',
    defaultLabel: 'Перевірити якість фотографій та відповідність білому фону',
  },
  {
    key: 'exportReady',
    labelKey: 'suppliers:chkExportFeed',
    defaultLabel: 'Сформувати експортне посилання для кабінету продавця',
  },
];
