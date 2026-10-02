import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { buscarQuestao } from '../data'
import { useJogo } from '../store/useJogo'
import { MAX_QUESTOES_POR_REVISAO, questoesParaRevisar } from '../lib/revisao'
import { Sessao, type ItemSessao } from './Sessao'

/** Monta uma lição com as questões da fila de revisão que já venceram */
export function RevisaoPratica() {
  // As questões são escolhidas uma vez, ao abrir a tela
  const [itens] = useState<ItemSessao[]>(() =>
    questoesParaRevisar(useJogo.getState().filaRevisao)
      .slice(0, MAX_QUESTOES_POR_REVISAO)
      .map((item) => buscarQuestao(item.questaoId))
      // Questão que foi apagada do JSON simplesmente some da revisão
      .filter((local) => local !== undefined)
      .map((local) => ({ questao: local.questao, materiaId: local.materia.id })),
  )

  if (itens.length === 0) return <Navigate to="/revisao" replace />

  return <Sessao modo="revisao" titulo="Revisão de questões erradas" itens={itens} />
}
