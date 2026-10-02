import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { Botao } from './Botao'
import { Lapio } from './Lapio'

interface Props {
  acertou: boolean
  explicacao: string
  respostaCorreta: string
  aoContinuar: () => void
}

const ELOGIOS = ['Muito bem!', 'Mandou bem!', 'Exato!', 'Isso mesmo!', 'Perfeito!']

/** Faixa que sobe da parte de baixo depois de verificar a resposta */
export function PainelFeedback({ acertou, explicacao, respostaCorreta, aoContinuar }: Props) {
  const [elogio] = useState(() => ELOGIOS[Math.floor(Math.random() * ELOGIOS.length)])
  const titulo = acertou ? elogio : 'Não foi dessa vez'

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
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full ${acertou ? 'bg-agua' : 'bg-erro'} text-white`}
              >
                {acertou ? <Check className="h-5 w-5" strokeWidth={3.5} /> : <X className="h-5 w-5" strokeWidth={3.5} />}
              </span>
              <h3 className="text-xl font-extrabold">{titulo}</h3>
            </div>
            {!acertou && (
              <p className="mt-2 font-bold">
                Resposta correta: <span className="font-semibold">{respostaCorreta}</span>
              </p>
            )}
            <p className="mt-2 text-sm leading-relaxed text-texto">{explicacao}</p>
          </div>
        </div>
        <Botao variante={acertou ? 'primario' : 'perigo'} onClick={aoContinuar} className="w-full sm:w-44">
          Continuar
        </Botao>
      </div>
    </motion.div>
  )
}
