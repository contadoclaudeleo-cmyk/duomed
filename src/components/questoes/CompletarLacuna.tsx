import { motion } from 'framer-motion'
import { useEffect, useMemo } from 'react'
import type { QuestaoCompletarLacuna } from '../../types'
import { embaralhar } from '../../lib/embaralhar'
import type { PropsQuestao } from './tipos'

export function CompletarLacuna({ questao, resposta, aoResponder, verificada }: PropsQuestao<QuestaoCompletarLacuna>) {
  const ordem = useMemo(() => embaralhar(questao.opcoes), [questao])
  const escolhida = typeof resposta === 'string' ? resposta : null
  const [antes, depois] = questao.enunciado.split('___')
  const acertou = escolhida === questao.resposta

  useEffect(() => {
    if (verificada) return
    const tecla = (e: KeyboardEvent) => {
      const n = Number(e.key)
      if (n >= 1 && n <= ordem.length) aoResponder(ordem[n - 1])
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [verificada, ordem, aoResponder])

  const corLacuna = !escolhida
    ? 'border-borda-forte text-transparent'
    : !verificada
      ? 'border-agua bg-agua/10 text-agua-texto dark:text-menta'
      : acertou
        ? 'border-agua bg-acerto-fundo text-acerto-texto'
        : 'border-erro bg-erro-fundo text-erro-texto'

  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm font-bold uppercase tracking-wide text-texto-suave">Complete a frase</p>

      <p className="text-xl font-semibold leading-[2.4] sm:text-2xl">
        {antes}
        <button
          type="button"
          disabled={verificada || !escolhida}
          onClick={() => aoResponder(null)}
          aria-label={escolhida ? `Remover "${escolhida}"` : 'Lacuna vazia'}
          className={`mx-1 inline-flex min-w-28 items-center justify-center rounded-xl border-2 border-dashed px-3 py-0.5 align-middle font-bold leading-normal ${corLacuna}`}
        >
          {escolhida ? (
            <motion.span key={escolhida} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              {escolhida}
            </motion.span>
          ) : (
            '....'
          )}
        </button>
        {depois}
      </p>

      {/* Banco de palavras */}
      <div className="flex flex-wrap justify-center gap-3">
        {ordem.map((opcao) => {
          const usada = opcao === escolhida
          return (
            <button
              key={opcao}
              type="button"
              disabled={verificada || usada}
              onClick={() => aoResponder(opcao)}
              className={`rounded-xl border-2 px-4 py-2.5 font-semibold transition-all duration-100 ${
                usada
                  ? 'border-apagado bg-apagado text-transparent'
                  : 'border-borda bg-superficie shadow-[0_3px_0_0_var(--borda)] hover:bg-superficie-2 active:translate-y-[3px] active:shadow-none disabled:opacity-60'
              }`}
            >
              {opcao}
            </button>
          )
        })}
      </div>
    </div>
  )
}
