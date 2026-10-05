import { supabase } from './supabase'

// ============================================================
// Feedbacks enviados pela aba "Feedback" (tabela "feedbacks",
// ver supabase/feedback.sql). Cada pessoa só vê os próprios.
// ============================================================

export type TipoFeedback = 'sugestao' | 'problema' | 'conteudo' | 'elogio'

export interface Feedback {
  id: number
  tipo: TipoFeedback
  nota: number | null
  mensagem: string
  criado_em: string
}

export const MAX_CARACTERES = 2000

export async function enviarFeedback(tipo: TipoFeedback, mensagem: string, nota: number | null) {
  const { error } = await supabase.from('feedbacks').insert({ tipo, mensagem: mensagem.trim(), nota })
  if (error) throw new Error('Não deu para enviar. Confira a internet e tente de novo.')
}

export async function meusFeedbacks(): Promise<Feedback[]> {
  const { data, error } = await supabase
    .from('feedbacks')
    .select('id, tipo, nota, mensagem, criado_em')
    .order('criado_em', { ascending: false })
    .limit(20)
  if (error) return []
  return (data ?? []) as Feedback[]
}
