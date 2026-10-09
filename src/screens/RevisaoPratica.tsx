import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { buscarQuestao } from '../data'
import { useJogo } from '../store/useJogo'
import { MAX_QUESTOES_POR_REVISAO, questoesParaRevisar } from '../lib/revisao'
import { iniciarRevisao } from '../lib/estudo'
import type { OrigemRevisao } from '../types'
import { CarregarSessao } from '../components/CarregarSessao'
import { Sessao } from './Sessao'

const TITULOS: Record<OrigemRevisao, string> = {
  erro: 'Revisão de questões erradas',
  acerto: 'Revisão de questões acertadas',
}

/** Monta uma lição com as questões da fila de revisão que já venceram (erros ou acertos) */
export function RevisaoPratica() {
  const [parametros] = useSearchParams()
  const origem: OrigemRevisao = parametros.get('tipo') === 'acertos' ? 'acerto' : 'erro'

  // As questões são escolhidas uma vez, ao abrir a tela; o servidor manda o conteúdo
  const [ids] = useState<string[]>(() =>
    questoesParaRevisar(useJogo.getState().filaRevisao, Date.now(), origem)
      .map((item) => item.questaoId)
      // Questão que foi apagada do conteúdo simplesmente some da revisão
      .filter((id) => buscarQuestao(id) !== undefined)
      .slice(0, MAX_QUESTOES_POR_REVISAO),
  )

  if (ids.length === 0) return <Navigate to="/revisao" replace />

  return (
    <CarregarSessao abrir={() => iniciarRevisao(ids)} voltarPara="/revisao">
      {(s) => <Sessao modo="revisao" titulo={TITULOS[origem]} sessaoId={s.sessao} itens={s.questoes} />}
    </CarregarSessao>
  )
}
