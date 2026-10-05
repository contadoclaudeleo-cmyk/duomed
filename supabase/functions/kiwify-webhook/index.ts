// ============================================================
// Função "kiwify-webhook": a Kiwify chama este endereço a cada
// venda, renovação, reembolso etc. Aqui liberamos o Plus ou o pacote de vidas.
//
// No Supabase, deixe "Enforce JWT verification" DESLIGADO
// (quem chama é a Kiwify, não o app).
//
// Segurança: a Kiwify manda "?signature=..." na URL, que é o
// HMAC-SHA1 do corpo usando o token do webhook. Conferimos com o
// segredo KIWIFY_WEBHOOK_TOKEN (Supabase > Edge Functions > Secrets).
//
// De quem é a compra: o app abre o checkout com "?sck=<id da conta>",
// que volta em TrackingParameters.sck. Se não vier, procura pelo e-mail.
// ============================================================
import { createClient } from 'npm:@supabase/supabase-js@2'

// Dias de folga depois da data da próxima cobrança, para a renovação não cortar o Plus antes da hora
const FOLGA_DIAS = 3
// Vidas do pacote avulso (mesmo número de src/lib/planos.ts)
const VIDAS_POR_PACOTE = 50
const UM_DIA = 24 * 60 * 60 * 1000
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function hmacSha1(chave: string, texto: string) {
  const codificar = new TextEncoder()
  const k = await crypto.subtle.importKey('raw', codificar.encode(chave), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
  const assinatura = await crypto.subtle.sign('HMAC', k, codificar.encode(texto))
  return [...new Uint8Array(assinatura)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Compara sem vazar pelo tempo de resposta */
function iguais(a: string, b: string) {
  if (!a || a.length !== b.length) return false
  let diferenca = 0
  for (let i = 0; i < a.length; i++) diferenca |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diferenca === 0
}

const texto = (mensagem: string, status = 200) => new Response(mensagem, { status })

Deno.serve(async (req) => {
  const token = Deno.env.get('KIWIFY_WEBHOOK_TOKEN')
  if (!token) return texto('KIWIFY_WEBHOOK_TOKEN não configurado', 500)

  const bruto = await req.text()
  let corpo: Record<string, any>
  try {
    corpo = JSON.parse(bruto)
  } catch {
    return texto('corpo inválido', 400)
  }

  // A assinatura é calculada sobre o JSON; testamos o JSON refeito e o texto cru
  const recebida = new URL(req.url).searchParams.get('signature') ?? ''
  const valida =
    iguais(recebida, await hmacSha1(token, JSON.stringify(corpo))) || iguais(recebida, await hmacSha1(token, bruto))
  if (!valida) return texto('assinatura inválida', 401)

  // Algumas entregas vêm dentro de "order"
  const pedido = (corpo.order ?? corpo) as Record<string, any>
  const evento = String(pedido.webhook_event_type ?? '')
  const idPedido = String(pedido.order_id ?? '')
  if (!evento || !idPedido) return texto('ignorado')

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  // De quem é a compra
  let userId: string | null = null
  const sck = String(pedido.TrackingParameters?.sck ?? '')
  if (UUID.test(sck)) userId = sck
  if (!userId && pedido.Customer?.email) {
    const { data } = await admin.rpc('usuario_por_email', { email_compra: pedido.Customer.email })
    userId = (data as string | null) ?? null
  }
  // Compra de alguém sem conta no DuoMed: responde ok para a Kiwify não ficar reenviando
  if (!userId) return texto('cliente sem conta no DuoMed')

  // O mesmo aviso pode chegar mais de uma vez: conta uma só
  const chave = `${evento}:${idPedido}`
  const { error: repetido } = await admin.from('pagamentos_processados').insert({ id: chave })
  if (repetido) return texto('já processado')

  try {
    const { data: conta } = await admin.from('assinaturas').select('*').eq('user_id', userId).maybeSingle()
    const agora = new Date()
    const ehAssinatura = !!(pedido.Subscription || pedido.subscription_id)
    const anual = /annual|year|anual/i.test(String(pedido.Subscription?.plan?.frequency ?? pedido.Subscription?.plan?.name ?? ''))

    if (evento === 'order_approved' || evento === 'subscription_renewed') {
      if (!ehAssinatura) {
        // Compra avulsa = pacote de vidas (o app busca e soma nas vidas)
        await admin.from('assinaturas').upsert({
          user_id: userId,
          vidas_compradas: (conta?.vidas_compradas ?? 0) + VIDAS_POR_PACOTE,
          atualizado_em: agora.toISOString(),
        })
        return texto('vidas liberadas')
      }

      // Plus vale até a próxima cobrança (+ folga). Sem essa data, conta 1 mês ou 1 ano a partir de hoje.
      const proxima = Date.parse(String(pedido.Subscription?.next_payment ?? ''))
      const base = Number.isFinite(proxima) && proxima > agora.getTime() ? proxima : agora.getTime() + (anual ? 365 : 31) * UM_DIA
      const fim = base + FOLGA_DIAS * UM_DIA
      const atual = conta?.valido_ate ? Date.parse(conta.valido_ate) : 0
      await admin.from('assinaturas').upsert({
        user_id: userId,
        plano: anual ? 'anual' : 'mensal',
        valido_ate: new Date(Math.max(atual, fim)).toISOString(),
        assinatura_kiwify: String(pedido.subscription_id ?? pedido.Subscription?.id ?? ''),
        atualizado_em: agora.toISOString(),
      })
      return texto('plus liberado')
    }

    if (evento === 'order_refunded' || evento === 'chargeback') {
      // Dinheiro devolvido: tira o que foi liberado
      if (ehAssinatura) {
        await admin.from('assinaturas').upsert({ user_id: userId, valido_ate: agora.toISOString(), atualizado_em: agora.toISOString() })
      } else {
        await admin
          .from('assinaturas')
          .upsert({
            user_id: userId,
            vidas_compradas: Math.max(0, (conta?.vidas_compradas ?? 0) - VIDAS_POR_PACOTE),
            atualizado_em: agora.toISOString(),
          })
      }
      return texto('estorno registrado')
    }

    // subscription_canceled / subscription_late: o Plus continua até a data já paga
    return texto('ignorado')
  } catch (e) {
    // Desfaz a marca de "processado" para a Kiwify tentar de novo
    await admin.from('pagamentos_processados').delete().eq('id', chave)
    return texto(e instanceof Error ? e.message : 'erro', 500)
  }
})
