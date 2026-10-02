import type { Licao, Materia, Questao, Unidade } from '../types'

// Todo arquivo .json dentro de src/data/materias entra no app automaticamente.
// Para criar uma matéria nova, basta criar um arquivo novo nessa pasta.
// Quando o conteúdo for para o Supabase, só este arquivo precisa mudar.
const arquivos = import.meta.glob<Materia>('./materias/*.json', { eager: true, import: 'default' })

export const MATERIAS: Materia[] = Object.values(arquivos).sort((a, b) => a.ordem - b.ordem)

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

/** Lista de lições de uma matéria, na ordem da trilha */
export const licoesDaMateria = (m: Materia) => m.unidades.flatMap((u) => u.licoes)
