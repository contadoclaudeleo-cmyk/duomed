import type { Contadores, IdConquista, LicaoConcluida, ModoSessao, RespostaDada } from '../types'
import { MATERIAS, materiaDisponivel } from '../data'
import { chaveDia, somarDias } from './datas'

// ============================================================
// Conquistas: cada uma tem uma regra que olha o estado do jogador.
// Depois de cada sessão verificamos quais regras passaram a valer.
// ============================================================

export interface Conquista {
  id: IdConquista
  titulo: string
  descricao: string
  /** Aparece no selo quando a conquista é desbloqueada */
  emoji: string
}

export const CONQUISTAS: Conquista[] = [
  { id: 'primeira_licao', titulo: 'Primeiro plantão', descricao: 'Conclua sua primeira lição', emoji: '🩺' },
  { id: 'licao_perfeita', titulo: 'Diagnóstico preciso', descricao: 'Termine uma lição sem errar nada', emoji: '🎯' },
  { id: 'unidade_completa', titulo: 'Módulo fechado', descricao: 'Complete todas as lições de uma unidade', emoji: '📚' },
  { id: 'ofensiva_3', titulo: 'Pegando no tranco', descricao: 'Alcance 3 dias de ofensiva', emoji: '🔥' },
  { id: 'ofensiva_7', titulo: 'Semana de residente', descricao: 'Alcance 7 dias de ofensiva', emoji: '📅' },
  { id: 'ofensiva_30', titulo: 'Mês de internato', descricao: 'Alcance 30 dias de ofensiva', emoji: '🏥' },
  { id: 'ofensiva_100', titulo: 'Chefe de plantão', descricao: 'Alcance 100 dias de ofensiva', emoji: '👑' },
  { id: 'ofensiva_365', titulo: 'Residente de carteirinha', descricao: 'Alcance 365 dias de ofensiva', emoji: '🏆' },
  { id: 'questoes_100', titulo: 'Centena', descricao: 'Responda 100 questões', emoji: '💯' },
  { id: 'questoes_500', titulo: 'Prontuário cheio', descricao: 'Responda 500 questões', emoji: '📋' },
  { id: 'questoes_1000', titulo: 'Mil e uma condutas', descricao: 'Responda 1.000 questões', emoji: '🧠' },
  { id: 'questoes_5000', titulo: 'Enciclopédia ambulante', descricao: 'Responda 5.000 questões', emoji: '📖' },
  { id: 'perfeitas_10', titulo: 'Mão de cirurgião', descricao: 'Termine 10 lições sem errar nada', emoji: '🔪' },
  { id: 'combo_10', titulo: 'Taquicardia de acertos', descricao: 'Acerte 10 questões seguidas', emoji: '💓' },
  { id: 'volta_por_cima', titulo: 'Reanimação', descricao: 'Erre as 2 primeiras e acerte todas as outras', emoji: '⚡' },
  { id: 'raio_x', titulo: 'Raio-X', descricao: 'Termine uma lição sem erros em menos de 2 minutos', emoji: '🩻' },
  { id: 'coruja', titulo: 'Plantão noturno', descricao: 'Estude entre meia-noite e 5h', emoji: '🦉' },
  { id: 'madrugador', titulo: 'Visita das 6', descricao: 'Estude entre 5h e 7h da manhã', emoji: '🌅' },
  { id: 'sem_folga', titulo: 'Sem folga', descricao: 'Estude no sábado e no domingo', emoji: '🏖️' },
  { id: 'meta_intensa', titulo: 'Modo intenso', descricao: 'Bata a meta intensa de 20 minutos', emoji: '🚀' },
  { id: 'revisao_10', titulo: 'Memória de elefante', descricao: 'Conclua 10 revisões', emoji: '🐘' },
  { id: 'primeiro_treino', titulo: 'Simulado ligado', descricao: 'Faça seu primeiro treino por prova', emoji: '📝' },
  { id: 'bancas_5', titulo: 'Turista de bancas', descricao: 'Treine provas de 5 bancas diferentes', emoji: '🧳' },
  { id: 'clinico_geral', titulo: 'Clínico geral', descricao: 'Responda questões de todas as grandes áreas', emoji: '🌎' },
  { id: 'nivel_10', titulo: 'Residente sênior', descricao: 'Chegue ao nível 10', emoji: '🎓' },
]

export interface DadosParaConquistas {
  licoesConcluidas: Record<string, LicaoConcluida>
  questoesRespondidas: number
  ofensivaAtual: number
  /** true se a sessão que acabou de terminar foi uma lição (ou treino) sem erros */
  sessaoPerfeita: boolean
  contadores: Contadores
  modo: ModoSessao
  /** Respostas da sessão que acabou de terminar, na ordem */
  respostas: RespostaDada[]
  tempoMs: number
  agora: number
  /** Tempo de estudo de cada dia, em milissegundos */
  tempoPorDia: Record<string, number>
  /** Matérias em que a pessoa já respondeu alguma questão */
  materiasRespondidas: string[]
  nivel: number
  metaDiaria: number
  /** true se a meta de hoje já foi batida */
  metaBatidaHoje: boolean
}

/** Maior número de acertos seguidos */
export function maiorSequencia(respostas: RespostaDada[]) {
  let maior = 0
  let atual = 0
  for (const r of respostas) {
    atual = r.acertou ? atual + 1 : 0
    maior = Math.max(maior, atual)
  }
  return maior
}

const regras: Record<IdConquista, (d: DadosParaConquistas) => boolean> = {
  primeira_licao: (d) => Object.keys(d.licoesConcluidas).length >= 1,
  licao_perfeita: (d) => d.sessaoPerfeita,
  unidade_completa: (d) =>
    MATERIAS.some((m) => m.unidades.some((u) => u.licoes.length > 0 && u.licoes.every((l) => d.licoesConcluidas[l.id]))),
  ofensiva_3: (d) => d.ofensivaAtual >= 3,
  ofensiva_7: (d) => d.ofensivaAtual >= 7,
  ofensiva_30: (d) => d.ofensivaAtual >= 30,
  ofensiva_100: (d) => d.ofensivaAtual >= 100,
  ofensiva_365: (d) => d.ofensivaAtual >= 365,
  questoes_100: (d) => d.questoesRespondidas >= 100,
  questoes_500: (d) => d.questoesRespondidas >= 500,
  questoes_1000: (d) => d.questoesRespondidas >= 1000,
  questoes_5000: (d) => d.questoesRespondidas >= 5000,
  perfeitas_10: (d) => d.contadores.licoesPerfeitas >= 10,
  combo_10: (d) => maiorSequencia(d.respostas) >= 10,
  volta_por_cima: (d) =>
    d.respostas.length >= 5 && !d.respostas[0].acertou && !d.respostas[1].acertou && d.respostas.slice(2).every((r) => r.acertou),
  raio_x: (d) => d.sessaoPerfeita && d.respostas.length >= 5 && d.tempoMs < 2 * 60 * 1000,
  coruja: (d) => new Date(d.agora).getHours() < 5,
  madrugador: (d) => [5, 6].includes(new Date(d.agora).getHours()),
  // Só no domingo dá para saber: estudou hoje e ontem (sábado)
  sem_folga: (d) =>
    new Date(d.agora).getDay() === 0 &&
    (d.tempoPorDia[chaveDia(d.agora)] ?? 0) > 0 &&
    (d.tempoPorDia[chaveDia(somarDias(d.agora, -1))] ?? 0) > 0,
  meta_intensa: (d) => d.metaDiaria >= 20 && d.metaBatidaHoje,
  revisao_10: (d) => d.contadores.revisoes >= 10,
  primeiro_treino: (d) => d.contadores.treinos >= 1,
  bancas_5: (d) => d.contadores.bancasTreinadas.length >= 5,
  clinico_geral: (d) => MATERIAS.filter(materiaDisponivel).every((m) => d.materiasRespondidas.includes(m.id)),
  nivel_10: (d) => d.nivel >= 10,
}

/** Retorna as conquistas que acabaram de ser desbloqueadas */
export function verificarConquistas(
  dados: DadosParaConquistas,
  jaDesbloqueadas: Partial<Record<IdConquista, number>>,
): IdConquista[] {
  return CONQUISTAS.map((c) => c.id).filter((id) => !jaDesbloqueadas[id] && regras[id](dados))
}

export const buscarConquista = (id: IdConquista) => CONQUISTAS.find((c) => c.id === id)!
