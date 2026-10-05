import { motion } from 'framer-motion'
import { Check, ChevronDown, Lightbulb, X } from 'lucide-react'
import { useState } from 'react'
import { Botao } from './Botao'
import { Lapio } from './Lapio'

interface Props {
  acertou: boolean
  explicacao: string
  respostaCorreta: string
  aoContinuar: () => void
  /**
   * Revisão no estilo Anki: depois de acertar, em vez de só "Continuar",
   * a pessoa escolhe Difícil, Bom ou Fácil (cada um mostra quando a questão volta).
   */
  avaliacao?: { nota: 'dificil' | 'bom' | 'facil'; rotulo: string; prazo: string }[]
  aoAvaliar?: (nota: 'dificil' | 'bom' | 'facil') => void
}

const CORES_NOTA = {
  dificil: 'bg-laranja shadow-[0_4px_0_0_var(--color-laranja-escura)]',
  bom: 'bg-agua shadow-[0_4px_0_0_var(--color-agua-escura)]',
  facil: 'bg-[#3b82f6] shadow-[0_4px_0_0_#1d4ed8]',
}

const ELOGIOS = ['Muito bem!', 'Mandou bem!', 'Exato!', 'Isso mesmo!', 'Perfeito!']

/** Faixa que sobe da parte de baixo depois de verificar a resposta */
export function PainelFeedback({ acertou, explicacao, respostaCorreta, aoContinuar, avaliacao, aoAvaliar }: Props) {
  const [elogio] = useState(() => ELOGIOS[Math.floor(Math.random() * ELOGIOS.length)])
  const titulo = acertou ? elogio : 'Não foi dessa vez'
  // O comentário só aparece se a pessoa pedir
  const [mostrarResolucao, setMostrarResolucao] = useState(false)

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
      className={`pb-seguro border-t-2 ${acertou ? 'border-agua/30 bg-acerto-fundo' : 'border-erro/30 bg-erro-fundo'}`}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-end sm:gap-6">
        <div className="flex flex-1 gap-3">
          <Lapio humor={acertou ? 'acerto' : 'erro'} altura={64} className="shrink-0" />
          <div className={`flex-1 ${acertou ? 'text-acerto-texto' : 'text-erro-texto'}`}>
            <div className="flex items-center gap-2">
              <motion.span
                className={`flex h-8 w-8 items-center justify-center rounded-full ${acertou ? 'bg-agua' : 'bg-erro'} text-white`}
                initial={{ scale: 0, rotate: acertou ? -120 : 0 }}
                animate={acertou ? { scale: 1, rotate: 0 } : { scale: 1, rotate: [0, -14, 12, -8, 0] }}
                transition={{
                  scale: { type: 'spring', stiffness: 480, damping: 14, delay: 0.12 },
                  // Mola só aceita dois valores; o balanço do erro usa animação comum
                  rotate: acertou ? { type: 'spring', stiffness: 300, damping: 15, delay: 0.12 } : { duration: 0.5, delay: 0.25 },
                }}
              >
                {acertou ? <Check className="h-5 w-5" strokeWidth={3.5} /> : <X className="h-5 w-5" strokeWidth={3.5} />}
              </motion.span>
              <motion.h3
                className="text-xl font-extrabold"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.18, duration: 0.25 }}
              >
                {titulo}
              </motion.h3>
            </div>
            {!acertou && (
              <p className="mt-2 font-bold">
                Resposta correta: <span className="font-semibold">{respostaCorreta}</span>
              </p>
            )}
            <button
              type="button"
              onClick={() => setMostrarResolucao((m) => !m)}
              aria-expanded={mostrarResolucao}
              className={`mt-2 inline-flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-sm font-extrabold transition-colors ${
                acertou ? 'border-agua/40 hover:bg-agua/10' : 'border-erro/40 hover:bg-erro/10'
              }`}
            >
              <Lightbulb className="h-4 w-4" strokeWidth={2.6} aria-hidden />
              {mostrarResolucao ? 'Esconder resolução' : 'Ver resolução'}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${mostrarResolucao ? 'rotate-180' : ''}`}
                strokeWidth={2.6}
                aria-hidden
              />
            </button>
            {mostrarResolucao && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 max-h-40 overflow-y-auto text-sm leading-relaxed text-texto"
              >
                {explicacao}
              </motion.p>
            )}
          </div>
        </div>
        {acertou && avaliacao && aoAvaliar ? (
          <div className="w-full sm:w-auto">
            <p className="mb-2 text-center text-xs font-extrabold uppercase tracking-wide text-acerto-texto sm:text-right">
              Como foi? A questão volta em…
            </p>
            <div className="grid grid-cols-3 gap-2 sm:w-96">
              {avaliacao.map(({ nota, rotulo, prazo }) => (
                <button
                  key={nota}
                  type="button"
                  onClick={() => {
                    aoAvaliar(nota)
                    aoContinuar()
                  }}
                  className={`flex flex-col items-center rounded-2xl px-2 py-2.5 font-extrabold text-white transition-transform active:translate-y-1 active:shadow-none ${CORES_NOTA[nota]}`}
                >
                  <span className="text-sm uppercase tracking-wide">{rotulo}</span>
                  <span className="text-xs font-bold opacity-90">{prazo}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <Botao variante={acertou ? 'primario' : 'perigo'} onClick={aoContinuar} className="w-full sm:w-44">
            Continuar
          </Botao>
        )}
      </div>
    </motion.div>
  )
}
