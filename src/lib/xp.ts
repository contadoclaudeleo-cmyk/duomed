import type { RespostaDada } from '../types'

export type { RespostaDada }

// ============================================================
// XP e níveis
//   10 XP por lição concluída
//   +5 XP de bônus se não errar nenhuma questão
//   +2 XP por questão de caso clínico acertada
// A cada 100 XP o jogador sobe um nível.
// ============================================================

export const XP_LICAO = 10
export const XP_BONUS_PERFEITA = 5
export const XP_POR_CASO_CLINICO = 2
export const XP_POR_NIVEL = 100


export function calcularXpSessao(respostas: RespostaDada[]) {
  const perfeita = respostas.length > 0 && respostas.every((r) => r.acertou)
  const casosAcertados = respostas.filter((r) => r.acertou && r.questao.tipo === 'caso_clinico').length

  const base = XP_LICAO
  const bonus = perfeita ? XP_BONUS_PERFEITA : 0
  const casos = casosAcertados * XP_POR_CASO_CLINICO
  return { base, perfeita: bonus, casos, total: base + bonus + casos }
}

/** Nível 1 vai de 0 a 99 XP, nível 2 de 100 a 199, e assim por diante */
export function nivelDoXp(xp: number) {
  return Math.floor(xp / XP_POR_NIVEL) + 1
}

/** Quanto XP já foi feito dentro do nível atual (0 a 99) */
export function progressoNoNivel(xp: number) {
  return xp % XP_POR_NIVEL
}
