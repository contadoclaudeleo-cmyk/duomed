import type { MetaDiaria } from '../types'

/** As três metas diárias, com nome no lugar do número de XP */
export const METAS: { valor: MetaDiaria; nome: string; descricao: string }[] = [
  { valor: 10, nome: 'Leve', descricao: 'Cerca de 1 lição por dia' },
  { valor: 20, nome: 'Moderada', descricao: 'Cerca de 2 lições por dia' },
  { valor: 30, nome: 'Intensa', descricao: 'Cerca de 3 lições por dia' },
]
