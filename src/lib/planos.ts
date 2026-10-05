// ============================================================
// Planos do DuoMed Plus (vidas infinitas) e recarga avulsa de vidas.
// Os preços ficam todos aqui; as porcentagens de desconto são calculadas.
// O pagamento é feito na Kiwify (links abaixo); quem libera o Plus é
// a função supabase/functions/kiwify-webhook.
// ============================================================

export const PRECO_MENSAL = 9.99
export const PRECO_PRIMEIRO_MES = 4.99
export const PRECO_ANUAL = 49.99
export const PRECO_RECARGA = 1.99

export type IdPlano = 'anual' | 'mensal'

/** "R$ 49,99" */
export const reais = (valor: number) => `R$ ${valor.toFixed(2).replace('.', ',')}`

/** Desconto em % (arredondado) de um preço em relação a outro */
export const desconto = (preco: number, cheio: number) => Math.round((1 - preco / cheio) * 100)

/** Quanto custariam 12 meses no plano mensal */
export const ANO_NO_MENSAL = PRECO_MENSAL * 12

export const DESCONTO_ANUAL = desconto(PRECO_ANUAL, ANO_NO_MENSAL)
export const DESCONTO_PRIMEIRO_MES = desconto(PRECO_PRIMEIRO_MES, PRECO_MENSAL)
export const ANUAL_POR_MES = PRECO_ANUAL / 12

/**
 * Links de checkout da Kiwify (copie de cada produto/plano no painel da Kiwify).
 * Enquanto estiver vazio, o botão mostra "pagamento em breve".
 */
export const LINKS_KIWIFY: Record<IdPlano | 'recarga', string> = {
  anual: '',
  mensal: '',
  recarga: '',
}
