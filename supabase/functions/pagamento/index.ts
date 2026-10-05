// ============================================================
// Função "pagamento": cria a cobrança no Asaas e devolve o link
// da fatura (onde a pessoa paga com PIX, cartão ou boleto).
//
// Recebe: { tipo: 'anual' | 'mensal' | 'recarga', nome, cpf }
// Devolve: { url } ou { erro }
//
// Segredos (Supabase > Edge Functions > Secrets):
//   ASAAS_API_KEY  chave de API do Asaas (NUNCA colocar no app)
//   ASAAS_URL      https://sandbox.asaas.com/api/v3 para testes
//                  https://api.asaas.com/v3 para valer
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem por padrão.
//
// O CPF vai só para o Asaas (ele exige para emitir a cobrança);
// não guardamos o CPF no nosso banco.
// ============================================================
import { createClient } from 'npm:@supabase/supabase-js@2'

const ASAAS_URL = Deno.env.get('ASAAS_URL') ?? 'https://sandbox.asaas.com/api/v3'
const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY') ?? ''

// Mesmos preços de src/lib/planos.ts
const PRECOS = { anual: 49.99, mensal: 9.99, promo: 4.99, recarga: 1.99 }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const responder = (dados: unknown, status = 200) =>
  new Response(JSON.stringify(dados), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

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

/** Data de hoje no horário de Brasília, no formato AAAA-MM-DD */
const hoje = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

function cpfValido(cpf: string) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false
  const digito = (n: number) => {
    let soma = 0
    for (let i = 0; i < n; i++) soma += Number(cpf[i]) * (n + 1 - i)
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }
  return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10])
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return responder({ erro: 'Use POST.' }, 405)

  try {
    if (!ASAAS_API_KEY) throw new Error('Pagamento ainda não configurado.')
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Quem está pedindo (pelo login do app)
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
    const {
      data: { user },
    } = await admin.auth.getUser(token)
    if (!user) return responder({ erro: 'Entre na sua conta para continuar.' }, 401)

    const { tipo, nome, cpf } = await req.json()
    if (!['anual', 'mensal', 'recarga'].includes(tipo)) return responder({ erro: 'Plano inválido.' }, 400)
    const nomeLimpo = String(nome ?? '').trim()
    const cpfLimpo = String(cpf ?? '').replace(/\D/g, '')
    if (nomeLimpo.split(/\s+/).length < 2) return responder({ erro: 'Digite seu nome completo.' }, 400)
    if (!cpfValido(cpfLimpo)) return responder({ erro: 'CPF inválido. Confira os números.' }, 400)

    const { data: conta } = await admin.from('assinaturas').select('*').eq('user_id', user.id).maybeSingle()
    const ehPlus = !!conta?.valido_ate && new Date(conta.valido_ate) > new Date()
    if (tipo !== 'recarga' && ehPlus) return responder({ erro: 'Você já é Plus!' }, 400)

    // Cliente no Asaas: cria na primeira compra e reaproveita depois
    let cliente: string | null = conta?.asaas_cliente ?? null
    if (!cliente) {
      const novo = await asaas('/customers', 'POST', {
        name: nomeLimpo,
        cpfCnpj: cpfLimpo,
        email: user.email,
        externalReference: user.id,
      })
      cliente = novo.id as string
      await admin.from('assinaturas').upsert({ user_id: user.id, asaas_cliente: cliente, atualizado_em: new Date().toISOString() })
    }

    let url: string | undefined
    const assinaturaDireta = tipo === 'anual' || (tipo === 'mensal' && conta?.ja_usou_promo)

    if (assinaturaDireta) {
      // Assinatura recorrente: a 1ª fatura vence hoje
      const assinatura = await asaas('/subscriptions', 'POST', {
        customer: cliente,
        billingType: 'UNDEFINED', // a pessoa escolhe PIX, cartão ou boleto na fatura
        value: tipo === 'anual' ? PRECOS.anual : PRECOS.mensal,
        nextDueDate: hoje(),
        cycle: tipo === 'anual' ? 'YEARLY' : 'MONTHLY',
        description: tipo === 'anual' ? 'DuoMed Plus anual' : 'DuoMed Plus mensal',
        externalReference: user.id,
      })
      await admin.from('cobrancas').insert({ id: assinatura.id, user_id: user.id, tipo })
      const faturas = await asaas(`/subscriptions/${assinatura.id}/payments`)
      url = faturas?.data?.[0]?.invoiceUrl
    } else {
      // Pagamento avulso: recarga, ou o 1º mês em promoção (a assinatura de R$ 9,99
      // só é criada quando este pagamento for confirmado, ver asaas-webhook)
      const promo = tipo === 'mensal'
      const pagamento = await asaas('/payments', 'POST', {
        customer: cliente,
        billingType: 'UNDEFINED',
        value: promo ? PRECOS.promo : PRECOS.recarga,
        dueDate: hoje(),
        description: promo ? 'DuoMed Plus mensal (1º mês em promoção)' : 'DuoMed: recarga completa de vidas',
        externalReference: user.id,
      })
      await admin.from('cobrancas').insert({ id: pagamento.id, user_id: user.id, tipo: promo ? 'promo' : 'recarga' })
      url = pagamento.invoiceUrl
    }

    if (!url) throw new Error('A cobrança foi criada, mas sem link de pagamento.')
    return responder({ url })
  } catch (e) {
    return responder({ erro: e instanceof Error ? e.message : 'Não deu certo. Tente de novo.' }, 500)
  }
})
