import { motion } from 'framer-motion'

interface Props {
  /** De 0 a 1 */
  valor: number
  cor?: 'agua' | 'laranja'
  altura?: 'fina' | 'grossa'
  rotulo?: string
}

export function BarraProgresso({ valor, cor = 'agua', altura = 'grossa', rotulo }: Props) {
  const pct = Math.min(1, Math.max(0, valor)) * 100
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
      </motion.div>
    </div>
  )
}
