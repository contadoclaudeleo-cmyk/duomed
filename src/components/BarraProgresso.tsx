import { motion, useAnimationControls } from 'framer-motion'
import { useEffect, useRef } from 'react'

interface Props {
  /** De 0 a 1 */
  valor: number
  cor?: 'agua' | 'laranja'
  altura?: 'fina' | 'grossa'
  rotulo?: string
}

export function BarraProgresso({ valor, cor = 'agua', altura = 'grossa', rotulo }: Props) {
  const pct = Math.min(1, Math.max(0, valor)) * 100
  const brilho = useAnimationControls()
  const anterior = useRef(pct)

  // Quando a barra avança, um brilho passa por ela
  useEffect(() => {
    if (pct > anterior.current) brilho.start({ x: ['-120%', '420%'], transition: { duration: 0.7, delay: 0.15, ease: 'easeOut' } })
    anterior.current = pct
  }, [pct, brilho])

  return (
    <div
      role="progressbar"
      aria-label={rotulo}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`w-full overflow-hidden rounded-full bg-apagado ${altura === 'grossa' ? 'h-4' : 'h-2.5'}`}
    >
      <motion.div
        className={`relative h-full rounded-full ${cor === 'agua' ? 'bg-agua' : 'bg-laranja'}`}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      >
        {/* Faixa clara no topo, como no Duolingo */}
        {altura === 'grossa' && pct > 4 && (
          <span className="absolute inset-x-2 top-1 h-1 rounded-full bg-white/30" />
        )}
        <span className="absolute inset-0 overflow-hidden rounded-full">
          <motion.span
            className="absolute inset-y-0 left-0 w-1/4 -skew-x-12 bg-white/45"
            initial={{ x: '-120%' }}
            animate={brilho}
          />
        </span>
      </motion.div>
    </div>
  )
}
