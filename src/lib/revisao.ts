import type { ItemRevisao, OrigemRevisao } from '../types'
import { UM_DIA } from './datas'

// ============================================================
// Revisão com repetição espaçada no estilo do Anki (algoritmo SM-2)
//
// Cada questão da fila tem uma "facilidade" (começa em 2,5) e um
// intervalo em dias. Na revisão, depois de acertar, a pessoa diz
// como foi: Difícil, Bom ou Fácil.
//
// - Errou: volta para o começo (pode revisar de novo já) e fica
//   um pouco "mais difícil" (facilidade cai 0,2).
// - 1º acerto: volta em 1 dia (Fácil: 4 dias).
// - 2º acerto: volta em 6 dias (Difícil: 3, Fácil: 8).
// - Depois: intervalo × facilidade (Bom), × 1,2 (Difícil)
//   ou × facilidade × 1,3 (Fácil). Difícil tira 0,15 da facilidade
//   e Fácil soma 0,15.
// - Quando o próximo intervalo passaria de 180 dias, a questão
//   sai da fila: está dominada.
//
// Acertos na lição também entram, para o conteúdo não ser esquecido:
// já contam como 1º acerto e voltam em 3 dias.
// ============================================================

export type NotaRevisao = 'errei' | 'dificil' | 'bom' | 'facil'

export const FACILIDADE_INICIAL = 2.5
const FACILIDADE_MINIMA = 1.3
/** Intervalo a partir do qual a questão é considerada dominada e sai da fila */
const DIAS_DOMINADA = 180
export const MAX_QUESTOES_POR_REVISAO = 10

type Fila = Record<string, ItemRevisao>

export const origemDoItem = (item: ItemRevisao): OrigemRevisao => item.origem ?? 'erro'

/** Itens antigos (da versão 1, 3 e 7 dias) ganham os campos do SM-2 */
function comoSm2(item: ItemRevisao) {
  return {
    facilidade: item.facilidade ?? FACILIDADE_INICIAL,
    intervalo: item.intervalo ?? [0, 1, 3, 7][Math.min(item.etapa, 3)],
    repeticoes: item.repeticoes ?? item.etapa,
    lapsos: item.lapsos ?? 0,
  }
}

/** Em quantos dias a questão volta com essa nota (null = dominada, sai da fila) */
export function diasAteVoltar(item: ItemRevisao | undefined, nota: NotaRevisao): number | null {
  if (nota === 'errei') return 0
  const { facilidade, intervalo, repeticoes } = item ? comoSm2(item) : { facilidade: FACILIDADE_INICIAL, intervalo: 0, repeticoes: 0 }
  const novaFacilidade = ajustarFacilidade(facilidade, nota)
  let dias: number
  if (repeticoes === 0) dias = nota === 'facil' ? 4 : 1
  else if (repeticoes === 1) dias = nota === 'dificil' ? 3 : nota === 'bom' ? 6 : 8
  else {
    const fator = nota === 'dificil' ? 1.2 : nota === 'bom' ? novaFacilidade : novaFacilidade * 1.3
    dias = Math.max(intervalo + 1, Math.round(intervalo * fator))
  }
  return dias > DIAS_DOMINADA ? null : dias
}

function ajustarFacilidade(facilidade: number, nota: NotaRevisao) {
  const delta = nota === 'errei' ? -0.2 : nota === 'dificil' ? -0.15 : nota === 'facil' ? 0.15 : 0
  return Math.max(FACILIDADE_MINIMA, Math.round((facilidade + delta) * 100) / 100)
}

/** Aplica a nota a uma questão da fila. Devolve a fila nova (a questão sai se ficou dominada). */
export function avaliarNaFila(fila: Fila, questaoId: string, nota: NotaRevisao, agora = Date.now()): Fila {
  const item = fila[questaoId]
  const atual = item ? comoSm2(item) : { facilidade: FACILIDADE_INICIAL, intervalo: 0, repeticoes: 0, lapsos: 0 }
  const dias = diasAteVoltar(item, nota)

  if (dias === null) {
    const resto = { ...fila }
    delete resto[questaoId]
    return resto
  }

  const errou = nota === 'errei'
  const repeticoes = errou ? 0 : atual.repeticoes + 1
  return {
    ...fila,
    [questaoId]: {
      questaoId,
      etapa: repeticoes,
      repeticoes,
      intervalo: dias,
      facilidade: ajustarFacilidade(atual.facilidade, nota),
      lapsos: atual.lapsos + (errou ? 1 : 0),
      proximaEm: agora + dias * UM_DIA,
      adicionadaEm: item?.adicionadaEm ?? agora,
      // Quem errou passa a ser questão de erro; quem acertou mantém a origem
      origem: errou ? 'erro' : (item?.origem ?? 'acerto'),
    },
  }
}

/** Questão errada (em lição ou revisão): entra na fila, ou volta para o começo */
export function registrarErroNaFila(fila: Fila, questaoId: string, agora = Date.now()): Fila {
  return avaliarNaFila(fila, questaoId, 'errei', agora)
}

/** Questão acertada na lição: entra na fila para reforço (volta em 3 dias), se ainda não estiver lá */
export function registrarAcertoNaLicao(fila: Fila, questaoId: string, agora = Date.now()): Fila {
  if (fila[questaoId]) return fila
  return {
    ...fila,
    [questaoId]: {
      questaoId,
      etapa: 1,
      repeticoes: 1,
      intervalo: 3,
      facilidade: FACILIDADE_INICIAL,
      lapsos: 0,
      proximaEm: agora + 3 * UM_DIA,
      adicionadaEm: agora,
      origem: 'acerto',
    },
  }
}

/** Questão acertada durante uma revisão (nota "Bom", a não ser que a pessoa escolha outra) */
export function registrarAcertoNaRevisao(fila: Fila, questaoId: string, agora = Date.now(), nota: NotaRevisao = 'bom'): Fila {
  if (!fila[questaoId]) return fila
  return avaliarNaFila(fila, questaoId, nota, agora)
}

/** "1 d", "6 d", "2 meses"... para mostrar nos botões de nota */
export function textoDoPrazo(dias: number | null): string {
  if (dias === null) return 'dominada'
  if (dias === 0) return 'agora'
  if (dias < 30) return `${dias} ${dias === 1 ? 'dia' : 'dias'}`
  const meses = Math.round(dias / 30)
  return `${meses} ${meses === 1 ? 'mês' : 'meses'}`
}

/** Questões que já podem ser revisadas agora, das mais antigas para as mais novas */
export function questoesParaRevisar(fila: Fila, agora = Date.now(), origem?: OrigemRevisao): ItemRevisao[] {
  return Object.values(fila)
    .filter((item) => item.proximaEm <= agora && (!origem || origemDoItem(item) === origem))
    .sort((a, b) => a.proximaEm - b.proximaEm)
}

/** Quando a próxima questão fica disponível (null se a fila estiver vazia) */
export function proximaRevisao(fila: Fila): number | null {
  const tempos = Object.values(fila).map((i) => i.proximaEm)
  return tempos.length ? Math.min(...tempos) : null
}
