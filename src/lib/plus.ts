import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { supabase } from './supabase'
import { LINKS_KIWIFY, type IdPlano } from './planos'

// ============================================================
// DuoMed Plus (vidas infinitas) e recargas compradas.
// Quem decide se a pessoa é Plus é o servidor (tabela "assinaturas",
// preenchida pelo aviso de pagamento da Kiwify). O app só lê e guarda
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

/**
 * Link do checkout da Kiwify com a conta da pessoa marcada (sck),
 * para o servidor saber de quem é a compra quando a Kiwify avisar.
 */
export function linkDeCompra(tipo: IdPlano | 'recarga', userId: string, email?: string): string | null {
  const base = LINKS_KIWIFY[tipo]
  if (!base) return null
  const url = new URL(base)
  url.searchParams.set('sck', userId)
  if (email) url.searchParams.set('email', email)
  return url.toString()
}

/** Gasta uma recarga guardada. Devolve true se deu certo. */
export async function usarRecarga(): Promise<boolean> {
  const { data, error } = await supabase.rpc('usar_recarga')
  if (error) throw new Error('Não deu para usar a recarga. Confira a internet.')
  await carregarPlus()
  return data === true
}
