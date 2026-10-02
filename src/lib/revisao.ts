import type { ItemRevisao } from '../types'
import { UM_DIA } from './datas'

// ============================================================
// Revisão com repetição espaçada (versão simples)
//
// 1. Errou uma questão: ela entra na fila e já pode ser revisada.
// 2. Acertou na revisão: ela volta depois de 1 dia.
// 3. Acertou de novo: volta depois de 3 dias.
// 4. Acertou de novo: volta depois de 7 dias.
// 5. Acertou mais uma vez: sai da fila (questão dominada).
// Se errar em qualquer etapa, volta para o começo.
// ============================================================

/** Intervalos depois de cada acerto na revisão, em dias */
export const INTERVALOS_DIAS = [1, 3, 7]
export const MAX_QUESTOES_POR_REVISAO = 10

type Fila = Record<string, ItemRevisao>

/** Questão errada (em lição ou revisão): entra na fila, ou volta para a etapa 0 */
export function registrarErroNaFila(fila: Fila, questaoId: string, agora = Date.now()): Fila {
  return {
    ...fila,
    [questaoId]: {
      questaoId,
      etapa: 0,
      proximaEm: agora,
      adicionadaEm: fila[questaoId]?.adicionadaEm ?? agora,
    },
  }
}

/** Questão acertada durante uma revisão: avança de etapa ou sai da fila */
export function registrarAcertoNaRevisao(fila: Fila, questaoId: string, agora = Date.now()): Fila {
  const item = fila[questaoId]
  if (!item) return fila

  if (item.etapa >= INTERVALOS_DIAS.length) {
    // Já passou por 1, 3 e 7 dias: questão dominada
    const resto = { ...fila }
    delete resto[questaoId]
    return resto
  }

  return {
    ...fila,
    [questaoId]: {
      ...item,
      proximaEm: agora + INTERVALOS_DIAS[item.etapa] * UM_DIA,
      etapa: item.etapa + 1,
    },
  }
}

/** Questões que já podem ser revisadas agora, das mais antigas para as mais novas */
export function questoesParaRevisar(fila: Fila, agora = Date.now()): ItemRevisao[] {
  return Object.values(fila)
    .filter((item) => item.proximaEm <= agora)
    .sort((a, b) => a.proximaEm - b.proximaEm)
}

/** Quando a próxima questão fica disponível (null se a fila estiver vazia) */
export function proximaRevisao(fila: Fila): number | null {
  const tempos = Object.values(fila).map((i) => i.proximaEm)
  return tempos.length ? Math.min(...tempos) : null
}
