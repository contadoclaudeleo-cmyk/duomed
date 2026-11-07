import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from './supabase'

// ============================================================
// Consentimentos (LGPD)
// - Termos de uso + política de privacidade: obrigatório para usar a conta.
//   O aceite fica registrado na tabela "consentimentos" (supabase/consentimento.sql),
//   com a versão aceita e a data. Sem IP e sem dados extras: só o necessário.
// - Cookies e medição de uso: só depois que a pessoa toca em "Aceitar".
//   Nada de medição roda antes disso (ver podeMedirUso).
// - Marketing por e-mail: consentimento separado, desligado por padrão.
// ============================================================

/** Mude esta data sempre que os termos ou a política mudarem: todos aceitam de novo */
export const VERSAO_TERMOS = '2026-11-06'

export type EscolhaCookies = 'aceito' | 'recusado' | null

interface EstadoConsentimento {
  /** Escolha do banner de cookies (null = ainda não escolheu) */
  cookies: EscolhaCookies
  /** Versão dos termos aceita neste aparelho e quando */
  termosVersao: string | null
  termosEm: string | null
  /** Quer receber novidades por e-mail (separado dos termos) */
  marketing: boolean
  /** Aceites feitos sem conta/sem internet, esperando para ir ao servidor */
  pendente: boolean
  /** Mostrar de novo o banner (botão "Preferências de cookies" no perfil) */
  bannerAberto: boolean
}

export const useConsentimento = create<EstadoConsentimento>()(
  persist(
    (): EstadoConsentimento => ({
      cookies: null as EscolhaCookies,
      termosVersao: null as string | null,
      termosEm: null as string | null,
      marketing: false,
      pendente: false,
      bannerAberto: false,
    }),
    { name: 'duomed-consentimento', partialize: ({ bannerAberto: _, ...resto }) => resto },
  ),
)

/** A medição de uso (acessos do dia, quem está online) só roda com aceite explícito */
export const podeMedirUso = () => useConsentimento.getState().cookies === 'aceito'

export const termosEmDia = () => useConsentimento.getState().termosVersao === VERSAO_TERMOS

export function escolherCookies(escolha: 'aceito' | 'recusado') {
  useConsentimento.setState({ cookies: escolha, bannerAberto: false })
  void gravarNoServidor([{ tipo: 'cookies', aceito: escolha === 'aceito' }])
}

/** Chamado no cadastro (checkbox) e na tela de "termos atualizados" */
export function aceitarTermos(marketing: boolean) {
  useConsentimento.setState({
    termosVersao: VERSAO_TERMOS,
    termosEm: new Date().toISOString(),
    marketing,
    pendente: true,
  })
  void enviarPendentes()
}

export function mudarMarketing(marketing: boolean) {
  useConsentimento.setState({ marketing })
  void gravarNoServidor([{ tipo: 'marketing', aceito: marketing }])
}

interface Registro {
  tipo: 'termos' | 'marketing' | 'cookies'
  aceito: boolean
}

/** Envia o aceite dos termos (e a escolha de marketing) feito antes de a conta existir */
export async function enviarPendentes() {
  const estado = useConsentimento.getState()
  if (!estado.pendente || !estado.termosVersao) return
  const ok = await gravarNoServidor([
    { tipo: 'termos', aceito: true },
    { tipo: 'marketing', aceito: estado.marketing },
    ...(estado.cookies ? [{ tipo: 'cookies' as const, aceito: estado.cookies === 'aceito' }] : []),
  ])
  if (ok) useConsentimento.setState({ pendente: false })
}

/**
 * Ao entrar na conta: se o servidor já tem o aceite da versão atual, vale para este
 * aparelho também (não pergunta de novo).
 */
export async function buscarDoServidor() {
  const { data: sessao } = await supabase.auth.getSession()
  if (!sessao.session) return
  const { data, error } = await supabase
    .from('consentimentos')
    .select('tipo, versao, aceito, criado_em')
    .order('criado_em', { ascending: false })
    .limit(30)
  if (error || !data) return
  const termos = data.find((r) => r.tipo === 'termos' && r.aceito && r.versao === VERSAO_TERMOS)
  const marketing = data.find((r) => r.tipo === 'marketing')
  const estado = useConsentimento.getState()
  useConsentimento.setState({
    ...(termos && !termosEmDia() ? { termosVersao: VERSAO_TERMOS, termosEm: termos.criado_em } : {}),
    ...(marketing && !estado.pendente ? { marketing: marketing.aceito } : {}),
  })
}

async function gravarNoServidor(registros: Registro[]): Promise<boolean> {
  try {
    const { data: sessao } = await supabase.auth.getSession()
    const userId = sessao.session?.user.id
    if (!userId) return false
    const { error } = await supabase.from('consentimentos').insert(
      registros.map((r) => ({ user_id: userId, tipo: r.tipo, aceito: r.aceito, versao: VERSAO_TERMOS })),
    )
    return !error
  } catch {
    return false
  }
}
