import type { Plan } from '../types'

export const plans: Plan[] = [
  {
    id: 'garimpo',
    name: 'Garimpo',
    badge: 'Entrada',
    price: 89.9,
    discsPerMonth: 1,
    description:
      'Um disco usado selecionado de acordo com o seu perfil musical.',
    features: [
      '1 disco usado por mês',
      'Curadoria alinhada ao seu gosto',
      'Limpeza, teste e classificação',
      'Cartão com a história do álbum',
    ],
    valueTierMin: 1,
  },
  {
    id: 'garimpo-plus',
    name: 'Garimpo Plus',
    price: 129.9,
    discsPerMonth: 1,
    description:
      'Curadoria mais específica, maior faixa de valor e preferência por edições especiais.',
    features: [
      '1 disco com curadoria premium',
      'Maior faixa de valor',
      'Preferência por edições especiais',
      'Embalagem especial',
    ],
    valueTierMin: 2,
    prefersSpecial: true,
  },
  {
    id: 'garimpo-duplo',
    name: 'Garimpo Duplo',
    price: 169.9,
    discsPerMonth: 2,
    description:
      'Dois discos usados por mês, com curadoria complementar.',
    features: [
      '2 discos por mês',
      'Curadoria complementar',
      'Mix familiar + descoberta',
      'Melhor custo por disco',
    ],
    valueTierMin: 1,
  },
]

export function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function getPlan(id: string): Plan | undefined {
  return plans.find((p) => p.id === id)
}
