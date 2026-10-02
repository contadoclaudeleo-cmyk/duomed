import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, type ReactNode } from 'react'

interface Props {
  aberto: boolean
  aoFechar: () => void
  children: ReactNode
}

/** No celular abre de baixo para cima; no computador aparece no centro */
export function Modal({ aberto, aoFechar, children }: Props) {
  useEffect(() => {
    if (!aberto) return
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar()
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [aberto, aoFechar])

  return (
    <AnimatePresence>
      {aberto && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <motion.div
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={aoFechar}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="pb-seguro relative w-full max-w-md rounded-t-3xl border-2 border-borda bg-superficie p-6 sm:rounded-3xl"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
