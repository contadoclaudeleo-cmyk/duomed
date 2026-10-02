import { Stethoscope } from 'lucide-react'
import type { QuestaoCasoClinico } from '../../types'
import { ListaOpcoes } from './ListaOpcoes'
import type { PropsQuestao } from './tipos'

export function CasoClinico({ questao, resposta, aoResponder, verificada }: PropsQuestao<QuestaoCasoClinico>) {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border-2 border-borda bg-superficie p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-laranja-escura">
          <Stethoscope className="h-5 w-5" strokeWidth={2.4} aria-hidden />
          Caso clínico
          <span className="ml-auto rounded-full bg-laranja/15 px-2 py-0.5 text-xs normal-case tracking-normal">
            +2 XP
          </span>
        </div>
        <p className="leading-relaxed">{questao.caso}</p>
      </div>
      <h2 className="text-lg font-bold leading-snug sm:text-xl">{questao.enunciado}</h2>
      <ListaOpcoes
        idQuestao={questao.id}
        opcoes={questao.opcoes}
        correta={questao.resposta}
        escolhida={typeof resposta === 'string' ? resposta : null}
        verificada={verificada}
        aoEscolher={aoResponder}
      />
    </div>
  )
}
