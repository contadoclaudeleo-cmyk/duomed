import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useJogo } from '../store/useJogo'
import { useAgora } from '../lib/hooks'
import { tempoParaProximaVida, VIDAS_MAX } from '../lib/vidas'
import { formatarDuracao } from '../lib/datas'
import { usePlus } from '../lib/plus'

/** Coração com o número de vidas. Opcionalmente mostra quanto falta para a próxima. */
export function ContadorVidas({ mostrarTempo = false }: { mostrarTempo?: boolean }) {
  const vidas = useJogo((s) => s.vidas)
  const ultimaRecarga = useJogo((s) => s.ultimaRecargaVida)
  const agora = useAgora(1000)
  const falta = tempoParaProximaVida({ vidas, ultimaRecarga }, agora)
  const plus = usePlus((p) => p.validoAte !== null && p.validoAte > agora)

  // Plus: vidas infinitas
  if (plus) {
    return (
      <div className="flex items-center gap-1.5 font-extrabold text-erro" aria-label="Vidas infinitas">
        <Heart className="h-6 w-6" fill="currentColor" strokeWidth={0} />
        <span className="text-xl leading-none">∞</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 font-extrabold text-erro" aria-label={`${vidas} vidas`}>
      <motion.span key={vidas} initial={{ scale: 1.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}>
        <Heart className="h-6 w-6" fill="currentColor" strokeWidth={0} />
      </motion.span>
      <span>{vidas}</span>
      {mostrarTempo && vidas < VIDAS_MAX && (
        <span className="ml-1 text-xs font-semibold text-texto-suave tabular-nums">{formatarDuracao(falta)}</span>
      )}
    </div>
  )
}
