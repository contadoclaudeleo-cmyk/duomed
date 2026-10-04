import { chaveDia, inicioDaSemana, somarDias, UM_DIA } from './datas'
import { supabase } from './supabase'

// ============================================================
// Ranking semanal com os jogadores reais (quem tem conta).
// Os dados vêm da função "ranking_semanal" do Supabase
// (veja supabase/ranking.sql), que devolve só o primeiro nome,
// a inicial do sobrenome e o XP da semana de cada pessoa.
// ============================================================

export interface JogadorRanking {
  posicao: number
  nome: string
  xp: number
  ehVoce: boolean
}

export interface ResultadoRanking {
  jogadores: JogadorRanking[]
  participantes: number
}

/** Busca o ranking da semana na nuvem */
export async function buscarRanking(): Promise<ResultadoRanking> {
  const { data, error } = await supabase.rpc('ranking_semanal')
  if (error) throw error
  const linhas = (data ?? []) as { posicao: number; nome: string; xp: number; eh_voce: boolean; participantes: number }[]
  return {
    jogadores: linhas.map((l) => ({ posicao: Number(l.posicao), nome: l.nome, xp: l.xp, ehVoce: l.eh_voce })),
    participantes: Number(linhas[0]?.participantes ?? 0),
  }
}

/** Soma o XP dos dias da semana atual (segunda a domingo) */
export function xpDaSemana(xpPorDia: Record<string, number>, agora = Date.now()): number {
  const segunda = inicioDaSemana(agora)
  let total = 0
  for (let i = 0; i < 7; i++) total += xpPorDia[chaveDia(somarDias(segunda, i))] ?? 0
  return total
}

/** Dias que faltam para o ranking reiniciar (domingo à meia-noite) */
export function diasParaFimDaSemana(agora = Date.now()): number {
  const fim = somarDias(inicioDaSemana(agora), 7).getTime()
  return Math.max(1, Math.ceil((fim - agora) / UM_DIA))
}
