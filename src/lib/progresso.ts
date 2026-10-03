import type { LicaoConcluida, Materia, NivelDificuldade } from '../types'
import { licoesDaMateria } from '../data'

// ============================================================
// Trilha da graduação: a ordem das lições é linear dentro de cada matéria.
// Uma lição só é liberada quando a anterior foi concluída.
// Trilha da residência: tudo liberado, a pessoa escolhe por onde estudar
// (tudo cai na mesma prova). A primeira lição pendente fica como sugestão.
// As trilhas fácil e difícil são independentes: cada uma tem sua ordem.
// ============================================================

/** livre: liberada para fazer, mas não é a próxima sugerida (só na residência) */
export type StatusLicao = 'concluida' | 'atual' | 'livre' | 'bloqueada'

export function statusDasLicoes(
  materia: Materia,
  concluidas: Record<string, LicaoConcluida>,
  nivel: NivelDificuldade,
): Record<string, StatusLicao> {
  const status: Record<string, StatusLicao> = {}
  let jaMarcouAtual = false
  for (const licao of licoesDaMateria(materia, nivel)) {
    if (concluidas[licao.id]) {
      status[licao.id] = 'concluida'
    } else if (!jaMarcouAtual) {
      status[licao.id] = 'atual'
      jaMarcouAtual = true
    } else {
      status[licao.id] = materia.modo === 'residencia' ? 'livre' : 'bloqueada'
    }
  }
  return status
}

export function contarConcluidas(
  materia: Materia,
  concluidas: Record<string, LicaoConcluida>,
  nivel?: NivelDificuldade,
) {
  const todas = licoesDaMateria(materia, nivel)
  return { feitas: todas.filter((l) => concluidas[l.id]).length, total: todas.length }
}
