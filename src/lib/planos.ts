// ============================================================
// Planos do DuoMed Plus (vidas infinitas) e recarga avulsa de vidas.
// Os preços ficam todos aqui; as porcentagens de desconto são calculadas.
// O pagamento ainda não está ligado: a loja mostra os planos e avisa que
// o pagamento chega em breve (ver screens/Loja.tsx).
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
