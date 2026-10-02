import type { Questao, Resposta } from '../../types'

/** Props que todo componente de questão recebe */
export interface PropsQuestao<Q extends Questao> {
  questao: Q
  resposta: Resposta | null
  aoResponder: (resposta: Resposta | null) => void
  /** true depois que o usuário clicou em "Verificar" */
  verificada: boolean
}
