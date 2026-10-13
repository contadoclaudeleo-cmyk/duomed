import type { Ofensiva } from '../types'
import { chaveDia, somarDias } from './datas'

// ============================================================
// Ofensiva (streak)
// Conta quantos dias seguidos o jogador bateu a meta diária (minutos de estudo).
// Se passar um dia inteiro sem bater a meta, a ofensiva zera.
// ============================================================

/**
 * Chamada sempre que o jogador estuda mais um pouco.
 * Se o feito de hoje (tempo de estudo) acabou de alcançar a meta, a ofensiva sobe.
 */
export function atualizarOfensiva(
  ofensiva: Ofensiva,
  feitoHoje: number,
  metaDiaria: number,
  agora = Date.now(),
): { ofensiva: Ofensiva; bateuMetaAgora: boolean } {
  const hoje = chaveDia(agora)

  // Meta ainda não batida, ou já contada hoje: nada muda
  if (feitoHoje < metaDiaria || ofensiva.ultimoDiaMeta === hoje) {
    return { ofensiva, bateuMetaAgora: false }
  }

  const ontem = chaveDia(somarDias(agora, -1))
  // Se bateu a meta ontem, a sequência continua. Senão, começa de novo em 1.
  const atual = ofensiva.ultimoDiaMeta === ontem ? ofensiva.atual + 1 : 1

  return {
    ofensiva: { atual, recorde: Math.max(ofensiva.recorde, atual), ultimoDiaMeta: hoje },
    bateuMetaAgora: true,
  }
}

/**
 * Valor da ofensiva para mostrar na tela.
 * Ela continua valendo se a meta foi batida hoje ou ontem
 * (ontem: o jogador ainda tem o dia de hoje para manter a sequência).
 */
export function ofensivaVigente(ofensiva: Ofensiva, agora = Date.now()): number {
  const hoje = chaveDia(agora)
  const ontem = chaveDia(somarDias(agora, -1))
  return ofensiva.ultimoDiaMeta === hoje || ofensiva.ultimoDiaMeta === ontem ? ofensiva.atual : 0
}
