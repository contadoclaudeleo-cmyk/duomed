import type { Questao as TQuestao, Resposta } from '../../types'
import { AssociarPares } from './AssociarPares'
import { CasoClinico } from './CasoClinico'
import { CompletarLacuna } from './CompletarLacuna'
import { IdentificarImagem } from './IdentificarImagem'
import { MultiplaEscolha } from './MultiplaEscolha'
import { VerdadeiroFalso } from './VerdadeiroFalso'

interface Props {
  questao: TQuestao
  resposta: Resposta | null
  aoResponder: (resposta: Resposta | null) => void
  verificada: boolean
}

/** Escolhe o componente certo para cada tipo de questão */
export function Questao({ questao, ...props }: Props) {
  switch (questao.tipo) {
    case 'multipla_escolha':
      return <MultiplaEscolha questao={questao} {...props} />
    case 'verdadeiro_falso':
      return <VerdadeiroFalso questao={questao} {...props} />
    case 'completar_lacuna':
      return <CompletarLacuna questao={questao} {...props} />
    case 'associar_pares':
      return <AssociarPares questao={questao} {...props} />
    case 'caso_clinico':
      return <CasoClinico questao={questao} {...props} />
    case 'identificar_imagem':
      return <IdentificarImagem questao={questao} {...props} />
  }
}
