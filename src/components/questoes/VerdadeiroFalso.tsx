import { Check, X } from 'lucide-react'
import { useEffect } from 'react'
import type { QuestaoVerdadeiroFalso } from '../../types'
import { Opcao, type EstadoOpcao } from './Opcao'
import type { PropsQuestao } from './tipos'

export function VerdadeiroFalso({ questao, resposta, aoResponder, verificada }: PropsQuestao<QuestaoVerdadeiroFalso>) {
  // Atalhos de teclado: V ou 1 = verdadeiro, F ou 2 = falso
  useEffect(() => {
    if (verificada) return
    const tecla = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k === 'v' || k === '1') aoResponder(true)
      if (k === 'f' || k === '2') aoResponder(false)
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [verificada, aoResponder])

  function estado(valor: boolean): EstadoOpcao {
    if (!verificada) return resposta === valor ? 'selecionada' : 'normal'
    if (valor === questao.resposta) return 'certa'
    if (valor === resposta) return 'errada'
    return 'apagada'
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm font-bold uppercase tracking-wide text-texto-suave">Esta afirmação é...</p>
      <div className="rounded-2xl border-2 border-borda bg-superficie p-5">
        <h2 className="text-xl font-bold leading-snug sm:text-2xl">{questao.enunciado}</h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[true, false].map((valor) => (
          <Opcao
            key={String(valor)}
            estado={estado(valor)}
            desabilitada={verificada}
            aoClicar={() => aoResponder(valor)}
            className="justify-center py-5 text-lg"
          >
            <span className="flex items-center justify-center gap-2">
              {valor ? <Check className="h-6 w-6" strokeWidth={3} /> : <X className="h-6 w-6" strokeWidth={3} />}
              {valor ? 'Verdadeiro' : 'Falso'}
            </span>
          </Opcao>
        ))}
      </div>
    </div>
  )
}
