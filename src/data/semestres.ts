import type { Materia } from '../types'
import { buscarMateria, materiaDisponivel } from './index'

// ============================================================
// Matérias mais comuns em cada semestre do curso de medicina.
// Cada faculdade organiza a grade de um jeito, então isto é uma
// sugestão baseada nas grades mais usadas no Brasil. O aluno pode
// estudar qualquer matéria pela tela "Matérias".
// Para mudar, troque os ids abaixo (são os nomes dos arquivos em data/graduacao).
// ============================================================

const INTERNATO = [
  'clinica-cirurgica',
  'pediatria-geral',
  'ginecologia-obstetricia-geral',
  'urgencia-emergencia',
  'medicina-familia',
  'saude-coletiva',
  'psiquiatria',
]

export const MATERIAS_POR_SEMESTRE: Record<number, string[]> = {
  1: ['anatomia', 'histologia-embriologia', 'biologia-celular', 'bioquimica', 'saude-coletiva', 'psicologia-medica'],
  2: ['anatomia', 'fisiologia', 'bioquimica', 'histologia-embriologia', 'genetica', 'saude-coletiva'],
  3: ['fisiologia', 'imunologia', 'microbiologia', 'parasitologia', 'patologia', 'farmacologia'],
  4: ['patologia', 'farmacologia', 'semiologia', 'medicina-familia', 'saude-coletiva', 'bioetica-medicina-legal'],
  5: ['semiologia', 'cardiologia', 'pneumologia', 'nefrologia', 'infectologia', 'hematologia', 'radiologia'],
  6: ['gastroenterologia', 'endocrinologia', 'reumatologia', 'neurologia', 'dermatologia', 'psiquiatria', 'anestesiologia'],
  7: ['clinica-cirurgica', 'ortopedia', 'urologia', 'otorrinolaringologia', 'oftalmologia', 'oncologia', 'geriatria'],
  8: ['ginecologia-obstetricia-geral', 'pediatria-geral', 'psiquiatria', 'urgencia-emergencia', 'bioetica-medicina-legal', 'medicina-familia'],
  9: ['clinica-cirurgica', 'pediatria-geral', 'ginecologia-obstetricia-geral', 'urgencia-emergencia', 'cardiologia', 'infectologia', 'medicina-familia'],
  10: ['clinica-cirurgica', 'pediatria-geral', 'ginecologia-obstetricia-geral', 'urgencia-emergencia', 'pneumologia', 'nefrologia', 'medicina-familia'],
  11: INTERNATO,
  12: INTERNATO,
}

/** Matérias do semestre (só as que já têm conteúdo) */
export function materiasDoSemestre(semestre: number | null | undefined): Materia[] {
  if (!semestre) return []
  return (MATERIAS_POR_SEMESTRE[semestre] ?? [])
    .map((id) => buscarMateria(id))
    .filter((m): m is Materia => !!m && materiaDisponivel(m))
}
