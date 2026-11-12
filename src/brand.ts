/** Identidade visual oficial Garimpo — tokens e assets. */
export const brand = {
  name: 'Garimpo',
  tagline: 'Curadoria musical em vinil usado',
  city: 'Belo Horizonte',
  pilotMonths: 3,
  pilotTargetSubscribers: 30,
  supportEmail: 'ola@garimpo.club',
  colors: {
    black: '#080808',
    graphite: '#252525',
    cream: '#F5F0E6',
    creamMuted: '#D8D0C0',
    gold: '#F5B82E',
    goldDark: '#C58B18',
  },
  /** Wordmark com fundo preto (hero / flyer). */
  logo: `${import.meta.env.BASE_URL}brand/garimpo-logo.png`,
  /** Wordmark transparente (header). */
  logoHeader: `${import.meta.env.BASE_URL}brand/garimpo-logo-header.png`,
  /** Disco + pepita. */
  mark: `${import.meta.env.BASE_URL}brand/garimpo-mark.png`,
} as const
