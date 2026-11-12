import type { ConditionGrade } from '../types'

const classMap: Record<ConditionGrade, string> = {
  Mint: 'condition--mint',
  NM: 'condition--nm',
  'VG+': 'condition--vgplus',
  VG: 'condition--vg',
  G: 'condition--g',
}

const labels: Record<ConditionGrade, string> = {
  Mint: 'Mint',
  NM: 'Near Mint',
  'VG+': 'VG+',
  VG: 'VG',
  G: 'G',
}

export function ConditionBadge({ grade }: { grade: ConditionGrade }) {
  return (
    <span className={`condition ${classMap[grade]}`} title={`Condição: ${labels[grade]}`}>
      {grade}
    </span>
  )
}
