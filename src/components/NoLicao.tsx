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
  /** Abre a revisão comentada (só aparece em lição concluída) */
  aoVerComentada: () => void
  /** Lição que acabou de ser concluída: comemora ao voltar para a trilha */
  recemConcluida?: boolean
}

const cores: Record<StatusLicao, string> = {
  concluida: 'bg-agua text-white shadow-[0_6px_0_0_var(--color-agua-escura)]',
  atual: 'bg-agua text-white shadow-[0_6px_0_0_var(--color-agua-escura)]',
  bloqueada: 'bg-apagado text-apagado-texto shadow-[0_6px_0_0_var(--apagado-sombra)]',
}

/** Um nó redondo da trilha, com o balão de detalhes ao tocar */
export function NoLicao({
  titulo,
  numero,
  totalNaUnidade,
  status,
  deslocamento,
  aberto,
  aoAlternar,
  aoComecar,
  aoVerComentada,
  recemConcluida,
}: Props) {
  const Icone = status === 'concluida' ? Check : status === 'atual' ? Star : Lock

  return (
    // Cada nó aparece com efeito de mola quando entra na tela
    <motion.div
      className={`relative flex flex-col items-center ${aberto ? 'z-20' : ''}`}
      style={{ x: deslocamento }}
      initial={{ opacity: 0, scale: 0.6 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      transition={{ type: 'spring', stiffness: 420, damping: 22 }}
    >
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

      <div className={`relative rounded-full p-1.5 ${status === 'atual' ? 'border-4 border-agua/25' : 'border-4 border-transparent'}`}>
        {/* Anel que pulsa em volta da próxima lição */}
        {status === 'atual' && (
          <motion.span
            className="pointer-events-none absolute -inset-1 rounded-full border-4 border-agua"
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 1.3 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
            aria-hidden
          />
        )}
        {/* Estrelinhas saindo da lição recém-concluída */}
        {recemConcluida && <Faiscas />}
        <motion.button
          type="button"
          onClick={aoAlternar}
          aria-label={`${titulo}, ${status === 'concluida' ? 'concluída' : status === 'atual' ? 'próxima lição' : 'bloqueada'}`}
          aria-expanded={aberto}
          className={`flex h-[70px] w-[70px] items-center justify-center rounded-full transition-[box-shadow] duration-75 active:shadow-none ${cores[status]}`}
          whileTap={{ y: 6 }}
          animate={
            recemConcluida
              ? { scale: [1, 1.3, 0.92, 1.08, 1], rotate: [0, -10, 8, 0], transition: { duration: 0.8, delay: 0.5 } }
              : undefined
          }
          transition={{ duration: 0.06 }}
        >
          <Icone
            className="h-8 w-8"
            strokeWidth={status === 'concluida' ? 3.5 : 2.5}
            fill={status === 'atual' ? 'currentColor' : 'none'}
          />
        </motion.button>
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
            {status === 'concluida' && (
              <button
                type="button"
                onClick={aoVerComentada}
                className="mt-2 w-full rounded-2xl border-2 border-white/60 py-2.5 text-sm font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-white/10"
              >
                Revisão comentada
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const ANGULOS_FAISCAS = [0, 45, 90, 135, 180, 225, 270, 315]

function Faiscas() {
  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
      {ANGULOS_FAISCAS.map((angulo, i) => {
        const rad = (angulo * Math.PI) / 180
        return (
          <motion.span
            key={angulo}
            className="absolute"
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{ x: Math.cos(rad) * 62, y: Math.sin(rad) * 62, scale: [0, 1.1, 0.6], opacity: [1, 1, 0] }}
            transition={{ duration: 0.9, delay: 0.55 + (i % 2) * 0.05, ease: 'easeOut' }}
          >
            <Star className={`h-4 w-4 ${i % 2 ? 'text-laranja' : 'text-agua'}`} fill="currentColor" strokeWidth={0} />
          </motion.span>
        )
      })}
    </span>
  )
}
