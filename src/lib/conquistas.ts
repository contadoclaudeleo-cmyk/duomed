import type { IdConquista, LicaoConcluida } from '../types'
import { MATERIAS } from '../data'

// ============================================================
// Conquistas: cada uma tem uma regra que olha o estado do jogador.
// Depois de cada sessão verificamos quais regras passaram a valer.
// ============================================================

export interface Conquista {
  id: IdConquista
  titulo: string
  descricao: string
}

export const CONQUISTAS: Conquista[] = [
  { id: 'primeira_licao', titulo: 'Primeiro plantão', descricao: 'Conclua sua primeira lição' },
  { id: 'licao_perfeita', titulo: 'Diagnóstico preciso', descricao: 'Termine uma lição sem errar nada' },
  { id: 'unidade_completa', titulo: 'Módulo fechado', descricao: 'Complete todas as lições de uma unidade' },
  { id: 'ofensiva_7', titulo: 'Semana de residente', descricao: 'Alcance 7 dias de ofensiva' },
  { id: 'questoes_100', titulo: 'Centena', descricao: 'Responda 100 questões' },
]

export interface DadosParaConquistas {
  licoesConcluidas: Record<string, LicaoConcluida>
  questoesRespondidas: number
  ofensivaAtual: number
  /** true se a sessão que acabou de terminar foi uma lição sem erros */
  sessaoPerfeita: boolean
}

const regras: Record<IdConquista, (d: DadosParaConquistas) => boolean> = {
  primeira_licao: (d) => Object.keys(d.licoesConcluidas).length >= 1,
  licao_perfeita: (d) => d.sessaoPerfeita,
  unidade_completa: (d) =>
    MATERIAS.some((m) => m.unidades.some((u) => u.licoes.length > 0 && u.licoes.every((l) => d.licoesConcluidas[l.id]))),
  ofensiva_7: (d) => d.ofensivaAtual >= 7,
  questoes_100: (d) => d.questoesRespondidas >= 100,
}

/** Retorna as conquistas que acabaram de ser desbloqueadas */
export function verificarConquistas(
  dados: DadosParaConquistas,
  jaDesbloqueadas: Partial<Record<IdConquista, number>>,
): IdConquista[] {
  return CONQUISTAS.map((c) => c.id).filter((id) => !jaDesbloqueadas[id] && regras[id](dados))
}

export const buscarConquista = (id: IdConquista) => CONQUISTAS.find((c) => c.id === id)!
