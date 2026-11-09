import { supabase } from './supabase'

// ============================================================
// Lembretes por notificação (push). O aparelho aceita aqui e a assinatura
// fica guardada na tabela push_assinaturas (supabase/lembretes.sql).
// A chave pública abaixo é pública por design; a privada fica só no servidor.
// ============================================================

const CHAVE_PUBLICA_PUSH = 'BFiBjv6xt3vbZb70zUFI2jzK7viQ7oUUTZEd9LfKG66lJodS3K0OO6R9SkHjvy8b5zilDmeErHf5vVmdJiQcY4k'

export type EstadoLembretes = 'indisponivel' | 'bloqueado' | 'desligado' | 'ligado'

export const lembretesSuportados = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

function chaveEmBytes(base64: string): Uint8Array<ArrayBuffer> {
  const preenchido = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const texto = atob(preenchido)
  const bytes = new Uint8Array(new ArrayBuffer(texto.length))
  for (let i = 0; i < texto.length; i++) bytes[i] = texto.charCodeAt(i)
  return bytes
}

async function assinaturaAtual() {
  const registro = await navigator.serviceWorker.ready
  return registro.pushManager.getSubscription()
}

export async function estadoDosLembretes(): Promise<EstadoLembretes> {
  if (!lembretesSuportados()) return 'indisponivel'
  if (Notification.permission === 'denied') return 'bloqueado'
  try {
    return (await assinaturaAtual()) ? 'ligado' : 'desligado'
  } catch {
    return 'indisponivel'
  }
}

/** Pede permissão, assina e guarda o aparelho no servidor. Devolve o estado final. */
export async function ligarLembretes(): Promise<EstadoLembretes> {
  if (!lembretesSuportados()) return 'indisponivel'
  const permissao = await Notification.requestPermission()
  if (permissao !== 'granted') return permissao === 'denied' ? 'bloqueado' : 'desligado'
  const registro = await navigator.serviceWorker.ready
  const assinatura =
    (await registro.pushManager.getSubscription()) ??
    (await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chaveEmBytes(CHAVE_PUBLICA_PUSH) }))
  const j = assinatura.toJSON()
  const { error } = await supabase
    .from('push_assinaturas')
    .upsert({ endpoint: assinatura.endpoint, p256dh: j.keys?.p256dh ?? '', auth: j.keys?.auth ?? '' }, { onConflict: 'endpoint' })
  if (error) {
    await assinatura.unsubscribe()
    throw error
  }
  return 'ligado'
}

export async function desligarLembretes(): Promise<EstadoLembretes> {
  const assinatura = await assinaturaAtual()
  if (assinatura) {
    await supabase.from('push_assinaturas').delete().eq('endpoint', assinatura.endpoint)
    await assinatura.unsubscribe()
  }
  return 'desligado'
}
