import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'

interface PropsNumero {
  valor: number
  /** Valor de onde a contagem começa (padrão: 0) */
  de?: number
  atraso?: number
  duracao?: number
  formatar?: (n: number) => string
}

/** Número que sobe contando até o valor final */
export function NumeroAnimado({ valor, de = 0, atraso = 0, duracao = 0.9, formatar = String }: PropsNumero) {
  const reduzir = useReducedMotion()
  const animar = !reduzir && de !== valor
  const atual = useMotionValue(animar ? de : valor)
  const texto = useTransform(atual, (v) => formatar(Math.round(v)))

  useEffect(() => {
    if (!animar) {
      atual.set(valor)
      return
    }
    atual.set(de)
    const controles = animate(atual, valor, { duration: duracao, delay: atraso, ease: 'easeOut' })
    return () => controles.stop()
  }, [atual, valor, de, atraso, duracao, animar])

  return <motion.span>{texto}</motion.span>
}

const CORES_CONFETE = ['#14b8a6', '#f59e0b', '#8ee5cf', '#ef4444', '#0f9488', '#fbbf24']

/** Chuva de confete que explode uma vez do meio da tela (comemoração) */
export function Confete({ quantidade = 56 }: { quantidade?: number }) {
  const reduzir = useReducedMotion()
  const [pecas] = useState(() =>
    Array.from({ length: quantidade }, (_, i) => {
      const largura = 6 + Math.random() * 6
      const redondo = Math.random() < 0.3
      return {
        id: i,
        cor: CORES_CONFETE[i % CORES_CONFETE.length],
        largura,
        altura: redondo ? largura : largura * 1.7,
        redondo,
        x: (Math.random() - 0.5) * Math.min(760, window.innerWidth * 1.1),
        pico: -(140 + Math.random() * 260),
        queda: 260 + Math.random() * 420,
        giro: (Math.random() - 0.5) * 900,
        atraso: Math.random() * 0.18,
        duracao: 1.7 + Math.random() * 1,
      }
    }),
  )

  if (reduzir) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {pecas.map((p) => (
        <motion.span
          key={p.id}
          className="absolute left-1/2 top-[38%]"
          style={{ width: p.largura, height: p.altura, background: p.cor, borderRadius: p.redondo ? '50%' : 2 }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{ x: p.x, y: [0, p.pico, p.queda], rotate: p.giro, opacity: [1, 1, 0] }}
          transition={{
            delay: p.atraso,
            duration: p.duracao,
            x: { delay: p.atraso, duration: p.duracao, ease: 'easeOut' },
            y: { delay: p.atraso, duration: p.duracao, times: [0, 0.3, 1], ease: ['easeOut', 'easeIn'] },
            opacity: { delay: p.atraso, duration: p.duracao, times: [0, 0.75, 1] },
          }}
        />
      ))}
    </div>
  )
}
