import { useCallback, useEffect, useState } from 'react'
import { MATERIAS, buscarMateria, materiaDisponivel } from '../data'
import { minhasEstatisticas, type LinhaEstatistica } from './estudo'

// ============================================================
// Porcentagens de acerto (geral, por área e por banca) e as
// recomendações da aba "Como melhorar". Os números vêm do servidor
// (cada resposta fica registrada lá; ver minhas_estatisticas em estudo.sql).
// ============================================================

export interface Placar {
  respondidas: number
  acertos: number
}

export interface Resumo {
  geral: Placar
  porMateria: Record<string, Placar>
  /** Todas as áreas juntas */
  porBanca: Record<string, Placar>
  porMateriaBanca: Record<string, Record<string, Placar>>
}

/** Porcentagem de acerto (0 a 100), ou null se ainda não respondeu nada */
export const porcentagem = (p?: Placar) => (p && p.respondidas > 0 ? Math.round((p.acertos / p.respondidas) * 100) : null)

const somar = (a: Placar | undefined, b: Placar): Placar => ({
  respondidas: (a?.respondidas ?? 0) + b.respondidas,
  acertos: (a?.acertos ?? 0) + b.acertos,
})

export function resumir(linhas: LinhaEstatistica[]): Resumo {
  const r: Resumo = { geral: { respondidas: 0, acertos: 0 }, porMateria: {}, porBanca: {}, porMateriaBanca: {} }
  for (const l of linhas) {
    const p = { respondidas: l.respondidas, acertos: l.acertos }
    r.geral = somar(r.geral, p)
    r.porMateria[l.materia] = somar(r.porMateria[l.materia], p)
    if (!l.banca) continue
    r.porBanca[l.banca] = somar(r.porBanca[l.banca], p)
    r.porMateriaBanca[l.materia] ??= {}
    r.porMateriaBanca[l.materia][l.banca] = somar(r.porMateriaBanca[l.materia][l.banca], p)
  }
  return r
}

/** Bancas que têm questões numa área (ou em todas, com null), da que tem mais para a que tem menos */
export function bancasDisponiveis(materiaId: string | null): { banca: string; questoes: number }[] {
  const contagem: Record<string, number> = {}
  for (const m of MATERIAS.filter(materiaDisponivel)) {
    if (materiaId && m.id !== materiaId) continue
    for (const [banca, n] of Object.entries(m.bancas ?? {})) contagem[banca] = (contagem[banca] ?? 0) + n
  }
  return Object.entries(contagem)
    .map(([banca, questoes]) => ({ banca, questoes }))
    .sort((a, b) => b.questoes - a.questoes || a.banca.localeCompare(b.banca))
}

/** Uma sugestão de treino na aba "Como melhorar" */
export interface Recomendacao {
  chave: string
  titulo: string
  motivo: string
  materiaId: string | null
  banca: string | null
  pct: number | null
}

/** Com menos respostas que isso, a porcentagem ainda não diz muita coisa */
export const MINIMO_PARA_AVALIAR = 5

/**
 * O que treinar agora: primeiro as combinações de área e banca com menor acerto,
 * depois a área mais fraca e as áreas que a pessoa ainda não tocou.
 */
export function recomendar(resumo: Resumo): Recomendacao[] {
  const nome = (id: string) => buscarMateria(id)?.nome ?? id
  const lista: Recomendacao[] = []

  const combinacoes = Object.entries(resumo.porMateriaBanca)
    .flatMap(([materiaId, bancas]) =>
      Object.entries(bancas).map(([banca, p]) => ({ materiaId, banca, p, pct: porcentagem(p)! })),
    )
    .filter((c) => c.p.respondidas >= MINIMO_PARA_AVALIAR && c.pct < 80)
    .sort((a, b) => a.pct - b.pct || b.p.respondidas - a.p.respondidas)
  for (const c of combinacoes.slice(0, 3))
    lista.push({
      chave: `${c.materiaId}|${c.banca}`,
      titulo: `${nome(c.materiaId)} · ${c.banca}`,
      motivo: `Você acerta ${c.pct}% (${c.p.acertos} de ${c.p.respondidas}) das questões dessa banca nessa área.`,
      materiaId: c.materiaId,
      banca: c.banca,
      pct: c.pct,
    })

  const areas = Object.entries(resumo.porMateria)
    .filter(([, p]) => p.respondidas >= MINIMO_PARA_AVALIAR)
    .map(([materiaId, p]) => ({ materiaId, p, pct: porcentagem(p)! }))
    .sort((a, b) => a.pct - b.pct)
  const fraca = areas[0]
  if (fraca && fraca.pct < 75 && !lista.some((r) => r.materiaId === fraca.materiaId))
    lista.push({
      chave: `${fraca.materiaId}|`,
      titulo: `${nome(fraca.materiaId)} · todas as bancas`,
      motivo: `É a sua área com menor acerto: ${fraca.pct}%. Um treino misturado ajuda a firmar a base.`,
      materiaId: fraca.materiaId,
      banca: null,
      pct: fraca.pct,
    })

  const naoTreinadas = MATERIAS.filter(materiaDisponivel).filter((m) => !resumo.porMateria[m.id]?.respondidas)
  for (const m of naoTreinadas.slice(0, 2))
    lista.push({
      chave: `${m.id}|novo`,
      titulo: `${m.nome} · todas as bancas`,
      motivo: 'Você ainda não respondeu questões dessa área. Que tal começar?',
      materiaId: m.id,
      banca: null,
      pct: null,
    })

  // No máximo 4 sugestões, para a lista não ficar longa demais
  lista.splice(4)
  if (lista.length === 0)
    lista.push({
      chave: 'geral',
      titulo: 'Treino geral',
      motivo:
        resumo.geral.respondidas > 0
          ? 'Você está indo bem em tudo! Um treino misturado mantém o ritmo.'
          : 'Responda algumas questões para eu descobrir seus pontos fracos.',
      materiaId: null,
      banca: null,
      pct: null,
    })
  return lista
}

/** Endereço da sessão de treino */
export function linkTreino(materiaId: string | null, banca: string | null) {
  const p = new URLSearchParams()
  if (materiaId) p.set('materia', materiaId)
  if (banca) p.set('banca', banca)
  const q = p.toString()
  return `/treino/jogar${q ? `?${q}` : ''}`
}

/** Busca as estatísticas no servidor ao abrir a tela */
export function useEstatisticas() {
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [erro, setErro] = useState<unknown>(null)
  const carregar = useCallback(() => {
    setErro(null)
    minhasEstatisticas().then(
      (linhas) => setResumo(resumir(linhas)),
      (e) => setErro(e),
    )
  }, [])
  useEffect(carregar, [carregar])
  return { resumo, erro, carregar }
}
