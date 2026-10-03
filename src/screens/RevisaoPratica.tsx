import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { buscarQuestao } from '../data'
import { useJogo } from '../store/useJogo'
import { MAX_QUESTOES_POR_REVISAO, questoesParaRevisar } from '../lib/revisao'
import type { OrigemRevisao } from '../types'
import { Sessao, type ItemSessao } from './Sessao'

const TITULOS: Record<OrigemRevisao, string> = {
  erro: 'Revisão de questões erradas',
  acerto: 'Revisão de questões acertadas',
}

/** Monta uma lição com as questões da fila de revisão que já venceram (erros ou acertos) */
export function RevisaoPratica() {
  const [parametros] = useSearchParams()
  const origem: OrigemRevisao = parametros.get('tipo') === 'acertos' ? 'acerto' : 'erro'

  // As questões são escolhidas uma vez, ao abrir a tela
  const [itens] = useState<ItemSessao[]>(() =>
    questoesParaRevisar(useJogo.getState().filaRevisao, Date.now(), origem)
      .slice(0, MAX_QUESTOES_POR_REVISAO)
      .map((item) => buscarQuestao(item.questaoId))
      // Questão que foi apagada do JSON simplesmente some da revisão
      .filter((local) => local !== undefined)
      .map((local) => ({ questao: local.questao, materiaId: local.materia.id })),
  )

  if (itens.length === 0) return <Navigate to="/revisao" replace />

  return <Sessao modo="revisao" titulo={TITULOS[origem]} itens={itens} />
}
