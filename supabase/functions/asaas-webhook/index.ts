// ============================================================
// Função "asaas-webhook": o Asaas chama este endereço quando um
// pagamento é confirmado. Aqui liberamos o Plus ou a recarga.
//
// No Supabase, esta função deve ficar com "Enforce JWT verification"
// DESLIGADO (quem chama é o Asaas, não o app). A segurança vem do
// token: o Asaas manda o cabeçalho "asaas-access-token", que precisa
// ser igual ao segredo ASAAS_WEBHOOK_TOKEN.
//
// Segredos: ASAAS_WEBHOOK_TOKEN, ASAAS_API_KEY, ASAAS_URL
// ============================================================
import { createClient } from 'npm:@supabase/supabase-js@2'

const ASAAS_URL = Deno.env.get('ASAAS_URL') ?? 'https://sandbox.asaas.com/api/v3'
const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY') ?? ''
const PRECO_MENSAL = 9.99
// Dias de folga depois do vencimento, para a renovação não cortar o Plus antes da hora
const FOLGA_DIAS = 3

async function asaas(caminho: string, metodo = 'GET', corpo?: unknown) {
  const resposta = await fetch(ASAAS_URL + caminho, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', access_token: ASAAS_API_KEY, 'User-Agent': 'DuoMed' },
    body: corpo ? JSON.stringify(corpo) : undefined,
  })
  const dados = await resposta.json().catch(() => ({}))
  if (!resposta.ok) throw new Error(dados?.errors?.[0]?.description ?? `Asaas respondeu ${resposta.status}`)
  return dados
}

/** "2026-10-04" + n meses, no formato AAAA-MM-DD */
function somarMeses(data: string, meses: number) {
  const d = new Date(`${data}T12:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + meses)
  return d.toISOString().slice(0, 10)
}

Deno.serve(async (req) => {
  const token = Deno.env.get('ASAAS_WEBHOOK_TOKEN')
  if (!token || req.headers.get('asaas-access-token') !== token) return new Response('não autorizado', { status: 401 })

  const evento = await req.json().catch(() => null)
  // Só interessa pagamento confirmado (cartão) ou recebido (PIX/boleto)
  if (!evento || !['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'].includes(evento.event)) return new Response('ignorado')

  const pagamento = evento.payment
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  // O mesmo pagamento pode chegar duas vezes (confirmado e depois recebido): conta uma só
  const { error: repetido } = await admin.from('pagamentos_processados').insert({ id: pagamento.id })
  if (repetido) return new Response('já processado')

  try {
    // Assinaturas são registradas pelo id da assinatura; avulsos, pelo id do pagamento
    const { data: cobranca } = await admin
      .from('cobrancas')
      .select('*')
      .eq('id', pagamento.subscription ?? pagamento.id)
      .maybeSingle()
    if (!cobranca) return new Response('cobrança desconhecida')

    const { data: conta } = await admin.from('assinaturas').select('*').eq('user_id', cobranca.user_id).maybeSingle()
    const agora = new Date().toISOString()

    if (cobranca.tipo === 'recarga') {
      await admin
        .from('assinaturas')
        .upsert({ user_id: cobranca.user_id, recargas: (conta?.recargas ?? 0) + 1, atualizado_em: agora })
      return new Response('ok')
    }

    // Plus: vale até o vencimento + 1 mês (ou 1 ano) + folga
    const meses = cobranca.tipo === 'anual' ? 12 : 1
    const vencimento = String(pagamento.dueDate ?? agora.slice(0, 10))
    const fim = new Date(`${somarMeses(vencimento, meses)}T23:59:59-03:00`)
    fim.setDate(fim.getDate() + FOLGA_DIAS)
    const atual = conta?.valido_ate ? new Date(conta.valido_ate) : null
    const validoAte = atual && atual > fim ? atual : fim

    await admin.from('assinaturas').upsert({
      user_id: cobranca.user_id,
      plano: cobranca.tipo === 'anual' ? 'anual' : 'mensal',
      valido_ate: validoAte.toISOString(),
      ja_usou_promo: conta?.ja_usou_promo || cobranca.tipo === 'promo',
      atualizado_em: agora,
    })

    // 1º mês em promoção pago: cria a assinatura de R$ 9,99, começando no mês seguinte
    if (cobranca.tipo === 'promo') {
      const assinatura = await asaas('/subscriptions', 'POST', {
        customer: pagamento.customer,
        billingType: 'UNDEFINED',
        value: PRECO_MENSAL,
        nextDueDate: somarMeses(vencimento, 1),
        cycle: 'MONTHLY',
        description: 'DuoMed Plus mensal',
        externalReference: cobranca.user_id,
      })
      await admin.from('cobrancas').insert({ id: assinatura.id, user_id: cobranca.user_id, tipo: 'mensal' })
    }

    return new Response('ok')
  } catch (e) {
    // Desfaz a marca de "processado" para o Asaas tentar de novo
    await admin.from('pagamentos_processados').delete().eq('id', pagamento.id)
    return new Response(e instanceof Error ? e.message : 'erro', { status: 500 })
  }
})
