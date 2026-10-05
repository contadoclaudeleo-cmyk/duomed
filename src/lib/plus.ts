import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { supabase } from './supabase'
import { LINKS_KIWIFY, type IdPlano } from './planos'

// ============================================================
// DuoMed Plus (vidas infinitas) e pacotes de vidas comprados.
// Quem decide se a pessoa é Plus é o servidor (tabela "assinaturas",
// preenchida pelo aviso de pagamento da Kiwify). O app só lê e guarda
// uma cópia no aparelho para funcionar sem internet.
// ============================================================

interface EstadoPlus {
  /** Até quando a pessoa é Plus (milissegundos), ou null */
  validoAte: number | null
  /** Vidas que acabaram de chegar de uma compra (mostra a comemoração; 0 = nada) */
  vidasRecebidas: number
}

export const usePlus = create<EstadoPlus>()(
  persist((): EstadoPlus => ({ validoAte: null, vidasRecebidas: 0 }), {
    name: 'duomed-plus',
    storage: createJSONStorage(() => localStorage),
    partialize: (s) => ({ validoAte: s.validoAte }) as EstadoPlus,
  }),
)

/** true se a pessoa é Plus agora */
export const ehPlus = (agora = Date.now()) => {
  const ate = usePlus.getState().validoAte
  return ate !== null && ate > agora
}

/** Busca na nuvem se a pessoa é Plus */
export async function carregarPlus() {
  const { data, error } = await supabase.from('assinaturas').select('valido_ate').maybeSingle()
  if (error) return
  usePlus.setState({ validoAte: data?.valido_ate ? Date.parse(data.valido_ate) : null })
}

/**
 * Pega as vidas compradas que ainda não chegaram no app (e zera o saldo na nuvem).
 * Devolve quantas são; quem chama soma nas vidas do jogo.
 */
export async function resgatarVidas(): Promise<number> {
  const { data, error } = await supabase.rpc('resgatar_vidas')
  if (error) return 0
  const quantas = Number(data ?? 0)
  if (quantas > 0) usePlus.setState({ vidasRecebidas: quantas })
  return quantas
}

/** Ao sair da conta, o Plus sai junto */
export function limparPlus() {
  usePlus.setState({ validoAte: null, vidasRecebidas: 0 })
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
