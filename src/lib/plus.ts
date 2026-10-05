import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { IdPlano } from './planos'

// ============================================================
// DuoMed Plus (vidas infinitas) e recargas compradas.
// Quem decide se a pessoa é Plus é o servidor (tabela "assinaturas",
// preenchida pelo aviso de pagamento do Asaas). O app só lê e guarda
// uma cópia no aparelho para funcionar sem internet.
// ============================================================

interface EstadoPlus {
  /** Até quando a pessoa é Plus (milissegundos), ou null */
  validoAte: number | null
  /** Recargas de vidas compradas e ainda não usadas */
  recargas: number
}

export const usePlus = create<EstadoPlus>()(
  persist((): EstadoPlus => ({ validoAte: null, recargas: 0 }), {
    name: 'duomed-plus',
    storage: createJSONStorage(() => localStorage),
  }),
)

/** true se a pessoa é Plus agora */
export const ehPlus = (agora = Date.now()) => {
  const ate = usePlus.getState().validoAte
  return ate !== null && ate > agora
}

/** Busca na nuvem a situação do Plus e das recargas */
export async function carregarPlus() {
  const { data, error } = await supabase.from('assinaturas').select('valido_ate, recargas').maybeSingle()
  if (error) return
  usePlus.setState({
    validoAte: data?.valido_ate ? Date.parse(data.valido_ate) : null,
    recargas: data?.recargas ?? 0,
  })
}

/** Ao sair da conta, o Plus sai junto */
export function limparPlus() {
  usePlus.setState({ validoAte: null, recargas: 0 })
}

/** Cria a cobrança no Asaas e devolve o link da fatura */
export async function iniciarPagamento(tipo: IdPlano | 'recarga', nome: string, cpf: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('pagamento', { body: { tipo, nome, cpf } })
  if (error) {
    // A função devolve { erro } com a explicação; tenta mostrar essa mensagem
    if (error instanceof FunctionsHttpError) {
      const corpo = await error.context.json().catch(() => null)
      if (corpo?.erro) throw new Error(corpo.erro)
    }
    throw new Error('Não deu para abrir o pagamento. Confira a internet e tente de novo.')
  }
  if (!data?.url) throw new Error(data?.erro ?? 'Não deu para abrir o pagamento.')
  return data.url as string
}

/** Gasta uma recarga guardada. Devolve true se deu certo. */
export async function usarRecarga(): Promise<boolean> {
  const { data, error } = await supabase.rpc('usar_recarga')
  if (error) throw new Error('Não deu para usar a recarga. Confira a internet.')
  await carregarPlus()
  return data === true
}
