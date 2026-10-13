import type { MetaDiaria } from '../types'
import { chaveDia } from './datas'

/** As três metas diárias, em minutos de estudo */
export const METAS: { valor: MetaDiaria; nome: string; descricao: string }[] = [
  { valor: 5, nome: 'Leve', descricao: '5 minutos por dia' },
  { valor: 10, nome: 'Moderada', descricao: '10 minutos por dia' },
  { valor: 20, nome: 'Intensa', descricao: '20 minutos por dia' },
]

/** Uma questão conta no máximo 3 minutos (quem larga o celular aberto não ganha tempo) */
export const TEMPO_MAX_POR_QUESTAO = 3 * 60 * 1000

/** Minutos estudados no dia (inteiros, para mostrar na tela) */
export const minutosDoDia = (tempoPorDia: Record<string, number>, dia = chaveDia()) =>
  Math.floor((tempoPorDia[dia] ?? 0) / 60000)

/** Metas antigas eram em XP (10, 20 ou 30): viram 5, 10 ou 20 minutos */
export const metaDeXpParaMinutos = (meta: number): MetaDiaria => (meta >= 30 ? 20 : meta >= 20 ? 10 : 5)
