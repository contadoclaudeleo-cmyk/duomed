import { AnimatePresence, motion } from 'framer-motion'
import { Check, Lock, Star } from 'lucide-react'
import type { StatusLicao } from '../lib/progresso'
import { Botao } from './Botao'

interface Props {
  titulo: string
  numero: number
  totalNaUnidade: number
  status: StatusLicao
  /** Deslocamento horizontal em px, para o caminho fazer curvas */
  deslocamento: number
  aberto: boolean
  aoAlternar: () => void
  aoComecar: () => void
}

const cores: Record<StatusLicao, string> = {
  concluida: 'bg-agua text-white shadow-[0_6px_0_0_var(--color-agua-escura)]',
  atual: 'bg-agua text-white shadow-[0_6px_0_0_var(--color-agua-escura)]',
  bloqueada: 'bg-apagado text-apagado-texto shadow-[0_6px_0_0_var(--apagado-sombra)]',
}

/** Um nó redondo da trilha, com o balão de detalhes ao tocar */
export function NoLicao({ titulo, numero, totalNaUnidade, status, deslocamento, aberto, aoAlternar, aoComecar }: Props) {
  const Icone = status === 'concluida' ? Check : status === 'atual' ? Star : Lock

  return (
    <div className={`relative flex flex-col items-center ${aberto ? 'z-20' : ''}`} style={{ transform: `translateX(${deslocamento}px)` }}>
      {/* Balão "Começar" pulando em cima da lição atual */}
      {status === 'atual' && !aberto && (
        <motion.div
          className="absolute -top-11 z-10 whitespace-nowrap rounded-xl border-2 border-borda bg-superficie px-3 py-1.5 text-sm font-extrabold uppercase tracking-wide text-agua-texto dark:text-menta"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          Começar
          <span className="absolute -bottom-[7px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-borda bg-superficie" />
        </motion.div>
      )}

      <div className={`rounded-full p-1.5 ${status === 'atual' ? 'border-4 border-agua/25' : 'border-4 border-transparent'}`}>
        <button
          type="button"
          onClick={aoAlternar}
          aria-label={`${titulo}, ${status === 'concluida' ? 'concluída' : status === 'atual' ? 'próxima lição' : 'bloqueada'}`}
          aria-expanded={aberto}
          className={`flex h-[70px] w-[70px] items-center justify-center rounded-full transition-[transform,box-shadow] duration-75 active:translate-y-[6px] active:shadow-none ${cores[status]}`}
        >
          <Icone
            className="h-8 w-8"
            strokeWidth={status === 'concluida' ? 3.5 : 2.5}
            fill={status === 'atual' ? 'currentColor' : 'none'}
          />
        </button>
      </div>

      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full z-20 mt-3 w-64 rounded-2xl p-4 ${
              status === 'bloqueada' ? 'border-2 border-borda bg-superficie' : 'bg-agua text-white'
            }`}
          >
            <span
              className={`absolute -top-[7px] left-1/2 h-3.5 w-3.5 -translate-x-1/2 rotate-45 ${
                status === 'bloqueada' ? 'border-l-2 border-t-2 border-borda bg-superficie' : 'bg-agua'
              }`}
            />
            <h3 className="text-lg font-extrabold">{titulo}</h3>
            <p className={`mb-4 text-sm ${status === 'bloqueada' ? 'text-texto-suave' : 'text-white/85'}`}>
              {status === 'bloqueada'
                ? 'Conclua as lições anteriores para liberar esta.'
                : `Lição ${numero} de ${totalNaUnidade}`}
            </p>
            {status === 'bloqueada' ? (
              <Botao larguraTotal tamanho="md" disabled>
                Bloqueada
              </Botao>
            ) : (
              <Botao larguraTotal tamanho="md" variante="claro" onClick={aoComecar}>
                {status === 'concluida' ? 'Praticar de novo' : 'Começar'}
              </Botao>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
