import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

// ============================================================
// CAPTCHA do Cloudflare (Turnstile): "confirme que você não é um robô".
// Só aparece quando existe a chave pública VITE_TURNSTILE_SITEKEY (ver .env.example).
// A chave secreta fica SÓ no painel do Supabase (Authentication > Attack Protection);
// é o Supabase que confere a resposta antes de aceitar login ou cadastro.
// ============================================================

export const CHAVE_CAPTCHA: string | undefined = import.meta.env.VITE_TURNSTILE_SITEKEY || undefined

const URL_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

interface Turnstile {
  render: (el: HTMLElement, opcoes: Record<string, unknown>) => string
  reset: (id: string) => void
  remove: (id: string) => void
}

declare global {
  interface Window {
    turnstile?: Turnstile
  }
}

let carregando: Promise<Turnstile> | null = null

function carregarScript(): Promise<Turnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  carregando ??= new Promise((resolver, falhar) => {
    const script = document.createElement('script')
    script.src = URL_SCRIPT
    script.async = true
    script.onload = () => (window.turnstile ? resolver(window.turnstile) : falhar(new Error('turnstile')))
    script.onerror = () => {
      carregando = null
      falhar(new Error('turnstile'))
    }
    document.head.appendChild(script)
  })
  return carregando
}

export interface ControleCaptcha {
  /** Pede um desafio novo (cada resposta só vale para uma tentativa) */
  reiniciar: () => void
}

interface Props {
  /** Recebe a resposta do desafio, ou null quando ela expira */
  aoResolver: (token: string | null) => void
  tema?: 'light' | 'dark' | 'auto'
}

/** Caixa do CAPTCHA. Não desenha nada se não houver chave configurada. */
export const Captcha = forwardRef<ControleCaptcha, Props>(function Captcha({ aoResolver, tema = 'auto' }, ref) {
  const caixa = useRef<HTMLDivElement>(null)
  const idWidget = useRef<string | null>(null)
  const retorno = useRef(aoResolver)
  retorno.current = aoResolver

  useImperativeHandle(ref, () => ({
    reiniciar: () => {
      retorno.current(null)
      if (idWidget.current && window.turnstile) window.turnstile.reset(idWidget.current)
    },
  }))

  useEffect(() => {
    if (!CHAVE_CAPTCHA) return
    let ativo = true
    carregarScript().then(
      (t) => {
        if (!ativo || !caixa.current) return
        idWidget.current = t.render(caixa.current, {
          sitekey: CHAVE_CAPTCHA,
          theme: tema,
          language: 'pt-br',
          callback: (token: string) => retorno.current(token),
          'expired-callback': () => retorno.current(null),
          'error-callback': () => retorno.current(null),
        })
      },
      () => {},
    )
    return () => {
      ativo = false
      if (idWidget.current && window.turnstile) window.turnstile.remove(idWidget.current)
      idWidget.current = null
    }
  }, [tema])

  if (!CHAVE_CAPTCHA) return null
  return <div ref={caixa} className="flex min-h-[65px] justify-center" />
})
