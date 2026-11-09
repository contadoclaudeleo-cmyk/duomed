// Envia o lembrete diário a quem aceitou notificações e ainda não estudou hoje.
// Chamada todo dia às 19h (Brasília) pelo agendador do banco (supabase/lembretes-envio.sql).
// Só aceita quem manda o cabeçalho x-cron-secret certo. As chaves ficam na tabela segredos_lembretes.
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const banco = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

const MENSAGENS = [
  { titulo: 'Seu foguinho está de olho 🔥', corpo: 'Você ainda não estudou hoje. Cinco minutos já mantêm a ofensiva.' },
  { titulo: 'Hora de uma lição rápida', corpo: 'Uma lição curta agora e o dia de estudo está salvo.' },
  { titulo: 'O Lápio sente sua falta 🐍', corpo: 'Que tal revisar umas questões antes de dormir?' },
]

Deno.serve(async (req) => {
  const { data: seg, error: e1 } = await banco.rpc('lembretes_segredos')
  if (e1 || !seg) return new Response('sem segredos', { status: 500 })
  if (req.headers.get('x-cron-secret') !== seg.cron) return new Response('não autorizado', { status: 401 })

  const { data: alvos, error: e2 } = await banco.rpc('lembretes_pendentes')
  if (e2) return new Response('erro ao listar', { status: 500 })

  webpush.setVapidDetails('mailto:DuoMed.app@gmail.com', seg.publica, seg.privada)
  const m = MENSAGENS[Math.floor(Date.now() / 86400000) % MENSAGENS.length]
  const carga = JSON.stringify({ ...m, url: './' })

  const mortos: string[] = []
  let enviados = 0
  for (const a of (alvos ?? []) as { endpoint: string; p256dh: string; auth: string }[]) {
    try {
      await webpush.sendNotification({ endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } }, carga, { TTL: 6 * 3600 })
      enviados++
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) mortos.push(a.endpoint)
    }
  }
  if (mortos.length) await banco.rpc('lembretes_remover', { p_endpoints: mortos })
  return Response.json({ alvos: alvos?.length ?? 0, enviados, removidos: mortos.length })
})
