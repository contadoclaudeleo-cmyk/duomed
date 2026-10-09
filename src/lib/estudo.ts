import { supabase } from './supabase'
import { usePlus } from './plus'
import { useJogo } from '../store/useJogo'
import type { Questao, Resposta } from '../types'

// ============================================================
// Estudo pelo servidor (ver supabase/estudo.sql).
// As questões completas, a correção, as vidas e o Plus ficam no Supabase.
// O app recebe as questões SEM a resposta e só vê a resposta e a
// explicação depois de responder. Mexer no aparelho não dá vidas nem Plus.
// ============================================================

/** Questão como chega antes de responder: sem resposta e sem explicação */
export type QuestaoSemResposta = Questao

export interface ItemServidor {
  questao: QuestaoSemResposta
  materiaId: string
}

export interface SessaoServidor {
  sessao: string
  questoes: ItemServidor[]
}

/** Vidas e Plus como o servidor conta (datas em milissegundos) */
export interface Situacao {
  vidas: number
  ultimaRecarga: number
  plusAte: number | null
  /** Vidas compradas que acabaram de entrar */
  recebidas: number
}

export interface Correcao {
  acertou: boolean
  /** Questão completa, com resposta e explicação */
  questao: Questao
  situacao: Situacao
}

/** Erros que o app sabe explicar para a pessoa */
export type ErroEstudo =
  | 'sem_vidas'
  | 'sem_login'
  | 'nada_para_revisar'
  | 'limite_teste'
  | 'licao_inexistente'
  | 'sessao_expirada'
  | 'offline'
  | 'desconhecido'

export class FalhaEstudo extends Error {
  constructor(public codigo: ErroEstudo) {
    super(codigo)
  }
}

const CONHECIDOS: ErroEstudo[] = ['sem_vidas', 'sem_login', 'nada_para_revisar', 'limite_teste', 'licao_inexistente', 'sessao_expirada']

async function chamar<T>(funcao: string, parametros?: Record<string, unknown>): Promise<T> {
  let resposta
  try {
    resposta = await supabase.rpc(funcao, parametros)
  } catch {
    throw new FalhaEstudo('offline')
  }
  const { data, error } = resposta
  if (error) {
    const msg = `${error.message ?? ''}`
    const codigo = CONHECIDOS.find((c) => msg.includes(c))
    if (codigo) throw new FalhaEstudo(codigo)
    if (/fetch|network|failed/i.test(msg)) throw new FalhaEstudo('offline')
    throw new FalhaEstudo('desconhecido')
  }
  return data as T
}

/** Guarda no app o que o servidor disse sobre vidas e Plus (só para mostrar na tela) */
export function aplicarSituacao(s: Situacao | null | undefined) {
  if (!s) return
  useJogo.getState().definirVidas(s.vidas, s.ultimaRecarga)
  usePlus.setState((p) => ({
    validoAte: s.plusAte,
    vidasRecebidas: s.recebidas > 0 ? s.recebidas : p.vidasRecebidas,
  }))
}

/** Vidas e Plus de agora (também entrega vidas compradas) */
export async function estadoVidas(): Promise<Situacao> {
  const s = await chamar<Situacao>('estado_vidas')
  aplicarSituacao(s)
  return s
}

/** Abre uma lição da trilha. Sem vidas e sem Plus, dá erro "sem_vidas". */
export async function iniciarLicao(licaoId: string): Promise<SessaoServidor> {
  const r = await chamar<SessaoServidor & { situacao: Situacao }>('iniciar_licao', { p_licao: licaoId })
  aplicarSituacao(r.situacao)
  return r
}

/** Abre a revisão com as questões da fila (só as que a pessoa já respondeu) */
export const iniciarRevisao = (ids: string[]) => chamar<SessaoServidor>('iniciar_revisao', { p_ids: ids })

/** Teste de nível (até 3 por dia) */
export const iniciarNivelamento = () => chamar<SessaoServidor>('iniciar_nivelamento')

/** Manda a resposta. O servidor corrige, tira a vida (se for o caso) e devolve a questão completa. */
export async function responderNoServidor(sessao: string, questaoId: string, resposta: Resposta | null): Promise<Correcao> {
  const r = await chamar<Correcao>('responder', { p_sessao: sessao, p_questao: questaoId, p_resposta: resposta })
  aplicarSituacao(r.situacao)
  return r
}

/** Gabarito comentado de uma lição (só as questões que a pessoa já respondeu) */
export const gabaritoLicao = (licaoId: string) => chamar<Questao[]>('gabarito_licao', { p_licao: licaoId })

/** Questão completa para o painel de administração */
export const questaoParaAdmin = (id: string) => chamar<Questao | null>('admin_questao', { p_id: id })

/** Texto para mostrar quando algo dá errado */
export function mensagemDoErro(e: unknown): string {
  const codigo = e instanceof FalhaEstudo ? e.codigo : 'desconhecido'
  switch (codigo) {
    case 'offline':
      return 'Sem conexão. As questões vêm do servidor: conecte-se à internet para estudar.'
    case 'sem_login':
      return 'Entre na sua conta para estudar.'
    case 'nada_para_revisar':
      return 'Nada para revisar agora.'
    case 'limite_teste':
      return 'Você já fez 3 testes de nível hoje. Tente de novo amanhã.'
    case 'licao_inexistente':
      return 'Essa lição não existe mais.'
    case 'sessao_expirada':
      return 'A lição ficou aberta tempo demais. Abra de novo para continuar.'
    case 'sem_vidas':
      return 'Suas vidas acabaram.'
    default:
      return 'Não deu certo. Tente de novo em instantes.'
  }
}
