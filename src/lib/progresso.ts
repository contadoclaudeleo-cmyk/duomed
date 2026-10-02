import type { LicaoConcluida, Materia } from '../types'
import { licoesDaMateria } from '../data'

// ============================================================
// Trilha: a ordem das lições é linear dentro de cada matéria.
// Uma lição só é liberada quando a anterior foi concluída.
// ============================================================

export type StatusLicao = 'concluida' | 'atual' | 'bloqueada'

export function statusDasLicoes(
  materia: Materia,
  concluidas: Record<string, LicaoConcluida>,
): Record<string, StatusLicao> {
  const status: Record<string, StatusLicao> = {}
  let jaMarcouAtual = false
  for (const licao of licoesDaMateria(materia)) {
    if (concluidas[licao.id]) {
      status[licao.id] = 'concluida'
    } else if (!jaMarcouAtual) {
      status[licao.id] = 'atual'
      jaMarcouAtual = true
    } else {
      status[licao.id] = 'bloqueada'
    }
  }
  return status
}

export function contarConcluidas(materia: Materia, concluidas: Record<string, LicaoConcluida>) {
  const todas = licoesDaMateria(materia)
  return { feitas: todas.filter((l) => concluidas[l.id]).length, total: todas.length }
}
