import type { QuestaoMultiplaEscolha } from '../../types'
import { ListaOpcoes } from './ListaOpcoes'
import type { PropsQuestao } from './tipos'

export function MultiplaEscolha({ questao, resposta, aoResponder, verificada }: PropsQuestao<QuestaoMultiplaEscolha>) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="whitespace-pre-line text-xl font-bold leading-snug sm:text-2xl">{questao.enunciado}</h2>
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
