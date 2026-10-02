import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export type EstadoOpcao = 'normal' | 'selecionada' | 'certa' | 'errada' | 'apagada'

const estilos: Record<EstadoOpcao, string> = {
  normal: 'border-borda bg-superficie shadow-[0_3px_0_0_var(--borda)] hover:bg-superficie-2',
  selecionada:
    'border-agua bg-agua/10 text-agua-texto dark:text-menta shadow-[0_3px_0_0_var(--color-agua)]',
  certa: 'border-agua bg-acerto-fundo text-acerto-texto shadow-[0_3px_0_0_var(--color-agua)]',
  errada: 'border-erro bg-erro-fundo text-erro-texto shadow-[0_3px_0_0_var(--color-erro)]',
  apagada: 'border-borda bg-superficie opacity-50 shadow-[0_3px_0_0_var(--borda)]',
}

const animacoes = {
  certa: { scale: [1, 1.04, 1], x: 0 },
  errada: { x: [0, -8, 8, -5, 5, 0], scale: 1 },
  outra: { scale: 1, x: 0 },
}

interface Props {
  estado: EstadoOpcao
  aoClicar?: () => void
  desabilitada?: boolean
  atalho?: string | number
  children: ReactNode
  className?: string
}

/** Uma alternativa clicável, usada em quase todos os tipos de questão */
export function Opcao({ estado, aoClicar, desabilitada, atalho, children, className = '' }: Props) {
  return (
    <motion.button
      type="button"
      onClick={aoClicar}
      disabled={desabilitada}
      aria-pressed={estado === 'selecionada'}
      animate={estado === 'certa' ? animacoes.certa : estado === 'errada' ? animacoes.errada : animacoes.outra}
      transition={{ duration: 0.4 }}
      className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left font-semibold transition-colors duration-100 ${desabilitada ? '' : 'active:translate-y-[3px] active:shadow-none'} ${estilos[estado]} ${className}`}
    >
      {atalho !== undefined && (
        <span className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-current text-xs font-bold opacity-50 sm:flex">
          {atalho}
        </span>
      )}
      <span className="flex-1">{children}</span>
    </motion.button>
  )
}
