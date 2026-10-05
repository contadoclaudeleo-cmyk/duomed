import { supabase } from './supabase'

// ============================================================
// Dados do Painel do administrador (ver supabase/admin.sql).
// Todas as funções conferem no servidor se a pessoa é admin.
// ============================================================

export interface ResumoAdmin {
  online_agora: number
  entraram_hoje: number
  contas_novas_hoje: number
  contas_total: number
  plus_ativos: number
  feedbacks_total: number
}

export interface DiaAdmin {
  dia: string
  jogadores: number
  contas_novas: number
}

export interface HorarioAdmin {
  dia_semana: number
  hora: number
  media: number
}

export interface FeedbackAdmin {
  id: number
  criado_em: string
  email: string
  nome: string | null
  tipo: 'sugestao' | 'problema' | 'conteudo' | 'elogio'
  nota: number | null
  mensagem: string
}

export interface OnlineAdmin {
  email: string
  nome: string | null
  visto_em: string
}

/** true se a conta logada é administradora */
export async function ehAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('eh_admin')
  return !error && data === true
}

async function chamar<T>(funcao: string): Promise<T> {
  const { data, error } = await supabase.rpc(funcao)
  if (error) throw new Error('Não deu para carregar. Confira a internet.')
  return data as T
}

export const buscarResumo = () => chamar<ResumoAdmin>('admin_resumo')
export const buscarPorDia = () => chamar<DiaAdmin[]>('admin_por_dia')
export const buscarHorarios = () => chamar<HorarioAdmin[]>('admin_horarios')
export const buscarFeedbacks = () => chamar<FeedbackAdmin[]>('admin_feedbacks')
export const buscarOnline = () => chamar<OnlineAdmin[]>('admin_online')
