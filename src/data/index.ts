import type { Licao, Materia, MateriaJson, ModoEstudo, NivelDificuldade, Questao, Unidade } from '../types'

// Todo arquivo .json dentro de src/data/graduacao e src/data/residencia entra
// no app automaticamente. A pasta define em qual modo a matéria aparece.
// Quando o conteúdo for para o Supabase, só este arquivo precisa mudar.
const graduacao = import.meta.glob<MateriaJson>('./graduacao/*.json', { eager: true, import: 'default' })
const residencia = import.meta.glob<MateriaJson>('./residencia/*.json', { eager: true, import: 'default' })

const comModo = (arquivos: Record<string, MateriaJson>, modo: ModoEstudo): Materia[] =>
  Object.values(arquivos)
    .map((m) => ({ ...m, modo }))
    .sort((a, b) => a.ordem - b.ordem)

export const MATERIAS: Materia[] = [...comModo(graduacao, 'graduacao'), ...comModo(residencia, 'residencia')]

export interface LocalQuestao {
  questao: Questao
  materia: Materia
  unidade: Unidade
  licao: Licao
}

export interface LocalLicao {
  licao: Licao
  materia: Materia
  unidade: Unidade
  /** Posição da lição dentro da unidade (começa em 0) */
  indiceNaUnidade: number
}

// Índices para achar rápido qualquer lição ou questão pelo id
const questoesPorId = new Map<string, LocalQuestao>()
const licoesPorId = new Map<string, LocalLicao>()

for (const materia of MATERIAS) {
  for (const unidade of materia.unidades) {
    unidade.licoes.forEach((licao, indiceNaUnidade) => {
      licoesPorId.set(licao.id, { licao, materia, unidade, indiceNaUnidade })
      for (const questao of licao.questoes) {
        questoesPorId.set(questao.id, { questao, materia, unidade, licao })
      }
    })
  }
}

export const buscarMateria = (id: string) => MATERIAS.find((m) => m.id === id)
export const buscarLicao = (id: string) => licoesPorId.get(id)
export const buscarQuestao = (id: string) => questoesPorId.get(id)
export const materiaDisponivel = (m: Materia) => m.unidades.length > 0
export const materiasDoModo = (modo: ModoEstudo) => MATERIAS.filter((m) => m.modo === modo)
/** Primeira matéria com conteúdo de um modo (usada ao trocar de modo) */
export const primeiraMateriaDoModo = (modo: ModoEstudo) => materiasDoModo(modo).find(materiaDisponivel)!

export const nivelDaUnidade = (u: Unidade): NivelDificuldade => u.nivel ?? 'facil'

/** Unidades de uma das trilhas (fácil ou difícil) da matéria */
export const unidadesDoNivel = (m: Materia, nivel: NivelDificuldade) =>
  m.unidades.filter((u) => nivelDaUnidade(u) === nivel)

/** Lista de lições de uma matéria, na ordem da trilha. Sem nível, traz as duas trilhas. */
export const licoesDaMateria = (m: Materia, nivel?: NivelDificuldade) =>
  (nivel ? unidadesDoNivel(m, nivel) : m.unidades).flatMap((u) => u.licoes)

export const NOMES_NIVEL: Record<NivelDificuldade, string> = {
  facil: 'Fácil',
  dificil: 'Difícil',
}

export const NOMES_MODO: Record<ModoEstudo, string> = {
  graduacao: 'Graduação',
  residencia: 'Residência',
}
