import { aleatorioComSemente, embaralhar } from './embaralhar'
import { chaveDia, inicioDaSemana, somarDias, UM_DIA } from './datas'

// ============================================================
// Ranking semanal com jogadores fictícios.
// Os rivais são gerados a partir da data da segunda-feira, então
// são sempre os mesmos durante a semana e mudam na seguinte.
// O XP deles cresce ao longo da semana para simular competição.
// ============================================================

const NOMES = [
  'Ana Beatriz', 'Rafael Moura', 'Júlia Campos', 'Pedro Henrique', 'Mariana Lopes', 'Lucas Andrade',
  'Camila Freitas', 'Gabriel Rocha', 'Isabela Nunes', 'Thiago Prado', 'Larissa Melo', 'Bruno Teixeira',
  'Fernanda Dias', 'Vinícius Alves', 'Letícia Ramos', 'Matheus Costa', 'Beatriz Lima', 'Gustavo Pires',
  'Carolina Souza', 'Felipe Martins', 'Amanda Ribeiro', 'Diego Carvalho', 'Natália Gomes', 'Rodrigo Barros',
]

export const JOGADORES_NA_LIGA = 15
export const ZONA_PROMOCAO = 3
export const ZONA_REBAIXAMENTO = 3

export interface JogadorLiga {
  id: string
  nome: string
  xp: number
  ehVoce: boolean
}

export function gerarLiga(nomeUsuario: string, xpSemanaUsuario: number, agora = Date.now()): JogadorLiga[] {
  const segunda = inicioDaSemana(agora)
  const aleatorio = aleatorioComSemente(chaveDia(segunda))
  // Quanto da semana já passou (0 na segunda 00:00, 7 no domingo 24:00)
  const diasPassados = Math.min(7, (agora - segunda.getTime()) / UM_DIA)

  const nomes = embaralhar(NOMES, aleatorio).slice(0, JOGADORES_NA_LIGA - 1)
  const rivais = nomes.map((nome, i) => {
    const ritmoDiario = 8 + Math.floor(aleatorio() * 55) // de 8 a 62 XP por dia
    const constancia = 0.6 + aleatorio() * 0.4
    return { id: `bot-${i}`, nome, xp: Math.round(ritmoDiario * diasPassados * constancia), ehVoce: false }
  })

  return [...rivais, { id: 'voce', nome: nomeUsuario, xp: xpSemanaUsuario, ehVoce: true }].sort(
    (a, b) => b.xp - a.xp || Number(b.ehVoce) - Number(a.ehVoce),
  )
}

/** Soma o XP dos dias da semana atual (segunda a domingo) */
export function xpDaSemana(xpPorDia: Record<string, number>, agora = Date.now()): number {
  const segunda = inicioDaSemana(agora)
  let total = 0
  for (let i = 0; i < 7; i++) total += xpPorDia[chaveDia(somarDias(segunda, i))] ?? 0
  return total
}

/** Dias que faltam para a liga terminar (domingo à meia-noite) */
export function diasParaFimDaLiga(agora = Date.now()): number {
  const fim = somarDias(inicioDaSemana(agora), 7).getTime()
  return Math.max(1, Math.ceil((fim - agora) / UM_DIA))
}
