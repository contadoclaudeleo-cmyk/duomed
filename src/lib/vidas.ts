import { UM_MINUTO } from './datas'

// ============================================================
// Vidas
// O jogador começa com 5 vidas e perde 1 a cada erro em lição.
// A cada 30 minutos recupera 1 vida, até o máximo de 5.
//
// Em vez de um cronômetro rodando, guardamos só um timestamp:
// "ultimaRecarga" = o momento a partir do qual contamos os 30 minutos.
// Assim a recarga funciona mesmo com o app fechado.
// ============================================================

export const VIDAS_MAX = 5
export const TEMPO_RECARGA_MS = 30 * UM_MINUTO

export interface EstadoVidas {
  vidas: number
  ultimaRecarga: number
}

/** Aplica as recargas que aconteceram desde ultimaRecarga até agora */
export function recarregarVidas(estado: EstadoVidas, agora = Date.now()): EstadoVidas {
  if (estado.vidas >= VIDAS_MAX) return { vidas: VIDAS_MAX, ultimaRecarga: agora }

  const recargas = Math.floor((agora - estado.ultimaRecarga) / TEMPO_RECARGA_MS)
  if (recargas <= 0) return estado

  const vidas = Math.min(VIDAS_MAX, estado.vidas + recargas)
  return {
    vidas,
    // Avança o relógio só pelas recargas já usadas, para não perder os minutos que sobraram
    ultimaRecarga: vidas >= VIDAS_MAX ? agora : estado.ultimaRecarga + recargas * TEMPO_RECARGA_MS,
  }
}

/** Tira uma vida. Se estava com vidas cheias, o relógio de recarga começa agora. */
export function perderVida(estado: EstadoVidas, agora = Date.now()): EstadoVidas {
  const atual = recarregarVidas(estado, agora)
  return {
    vidas: Math.max(0, atual.vidas - 1),
    ultimaRecarga: atual.vidas >= VIDAS_MAX ? agora : atual.ultimaRecarga,
  }
}

/** Milissegundos que faltam para ganhar a próxima vida (0 se estiver cheio) */
export function tempoParaProximaVida(estado: EstadoVidas, agora = Date.now()): number {
  const atual = recarregarVidas(estado, agora)
  if (atual.vidas >= VIDAS_MAX) return 0
  return Math.max(0, atual.ultimaRecarga + TEMPO_RECARGA_MS - agora)
}
