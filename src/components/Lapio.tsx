import { motion, type TargetAndTransition } from 'framer-motion'
import { arquivoPublico } from '../lib/caminho'

export type HumorLapio = 'parado' | 'acerto' | 'erro' | 'festa'

// Animações leves do mascote
const animacoes: Record<HumorLapio, TargetAndTransition> = {
  // Flutua devagar, sem parar
  parado: { y: [0, -6, 0], rotate: 0, transition: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } },
  // Pulinho no acerto
  acerto: { y: [0, -18, 0, -6, 0], rotate: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  // Balanço suave no erro
  erro: { rotate: [0, -6, 5, -3, 2, 0], y: 0, transition: { duration: 0.8, ease: 'easeInOut' } },
  // Comemoração na tela de resultado
  festa: {
    y: [0, -22, 0],
    rotate: [0, -4, 4, 0],
    transition: { duration: 0.8, repeat: Infinity, repeatDelay: 0.7, ease: 'easeOut' },
  },
}

interface Props {
  humor?: HumorLapio
  /** Altura em pixels */
  altura?: number
  className?: string
}

/** Lápio, a cobra mascote do DuoMed */
export function Lapio({ humor = 'parado', altura = 120, className = '' }: Props) {
  return (
    <motion.img
      key={humor}
      src={arquivoPublico('brand/lapio.png')}
      alt="Lápio, o mascote do DuoMed"
      draggable={false}
      style={{ height: altura, transformOrigin: '50% 100%' }}
      className={`w-auto select-none ${className}`}
      animate={animacoes[humor]}
    />
  )
}
