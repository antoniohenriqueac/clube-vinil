import type {
  SubscriberSellConfig,
  SubscriberSellListing,
  WalletEntry,
} from '../types'

export const defaultSellConfig: SubscriberSellConfig = {
  creditPercent: 50,
  cashPercent: 30,
  demandBonusPercent: 10,
  minMarketValue: 25,
}

export const SELL_STATUS_LABELS: Record<
  SubscriberSellListing['status'],
  string
> = {
  enviado: 'Enviado',
  'em-avaliacao': 'Em avaliação',
  oferta: 'Oferta',
  aceito: 'Aceito',
  recusado: 'Recusado',
  recebido: 'Recebido',
  'credito-liberado': 'Crédito liberado',
}

/** Example Discogs-like collection for seed/demo import. */
export const seedDiscogsCollection = [
  { artist: 'Tim Maia', album: 'Racional Vol. 1', condition: 'VG+' as const },
  { artist: 'Jorge Ben', album: 'A Tábua de Esmeralda', condition: 'VG' as const },
  { artist: 'Pink Floyd', album: 'The Dark Side of the Moon', condition: 'NM' as const },
  { artist: 'Elis Regina', album: 'Falso Brilhante', condition: 'VG+' as const },
  { artist: 'Marvin Gaye', album: "What's Going On", condition: 'VG' as const },
  { artist: 'Novos Baianos', album: 'Acabou Chorare', condition: 'G' as const },
  { artist: 'Queen', album: 'A Night at the Opera', condition: 'VG+' as const },
  { artist: 'Miles Davis', album: 'Kind of Blue', condition: 'NM' as const },
]

export const seedSellListings: SubscriberSellListing[] = [
  {
    id: 'sell-ana-1',
    subscriberId: 'sub-ana',
    status: 'oferta',
    items: [
      {
        id: 'si-1',
        artist: 'Cassiano',
        album: 'Cubatao',
        condition: 'VG+',
        photoDataUrls: [],
        fromDiscogsSeed: true,
      },
      {
        id: 'si-2',
        artist: 'Hyldon',
        album: 'Na Rua, Na Chuva, Na Fazenda',
        condition: 'VG',
        photoDataUrls: [],
        fromDiscogsSeed: true,
      },
    ],
    offers: [
      {
        itemId: 'si-1',
        artist: 'Cassiano',
        album: 'Cubatao',
        condition: 'VG+',
        marketValue: 200,
        creditOffer: 110,
        cashOffer: 60,
        demandBonus: 10,
        rejected: false,
        inDemand: true,
      },
      {
        itemId: 'si-2',
        artist: 'Hyldon',
        album: 'Na Rua, Na Chuva, Na Fazenda',
        condition: 'VG',
        marketValue: 93.5,
        creditOffer: 46.75,
        cashOffer: 28.05,
        demandBonus: 0,
        rejected: false,
        inDemand: false,
      },
    ],
    payoutChoice: null,
    deliveryMethod: null,
    adminNotes: 'Bom fit soul/funk — priorizar crédito.',
    createdAt: '2026-11-01T12:00:00.000Z',
    updatedAt: '2026-11-08T15:00:00.000Z',
    offerTotalCredit: 156.75,
    offerTotalCash: 88.05,
  },
]

export const seedWalletEntries: WalletEntry[] = [
  {
    id: 'w-ana-1',
    subscriberId: 'sub-bruno',
    type: 'credito',
    amount: 80,
    label: 'Crédito de venda de discos (demo anterior)',
    createdAt: '2026-10-20T10:00:00.000Z',
  },
  {
    id: 'w-bruno-2',
    subscriberId: 'sub-bruno',
    type: 'abatimento',
    amount: -40,
    label: 'Abatimento mensalidade outubro/2026',
    createdAt: '2026-10-25T10:00:00.000Z',
  },
]
