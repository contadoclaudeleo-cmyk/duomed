import { GraduationCap, SignalHigh, SignalLow, Stethoscope } from 'lucide-react'
import type { ModoEstudo, NivelDificuldade } from '../types'
import { NOMES_MODO, NOMES_NIVEL } from '../data'
import { Abas } from './Abas'

/** Abas para alternar entre Graduação e Residência */
export function AbasModo({ valor, aoMudar }: { valor: ModoEstudo; aoMudar: (modo: ModoEstudo) => void }) {
  return (
    <Abas
      rotulo="Modo de estudo"
      valor={valor}
      aoMudar={aoMudar}
      opcoes={[
        { valor: 'graduacao', rotulo: NOMES_MODO.graduacao, Icone: GraduationCap },
        { valor: 'residencia', rotulo: NOMES_MODO.residencia, Icone: Stethoscope },
      ]}
    />
  )
}

/** Abas para alternar entre a trilha Fácil e a Difícil */
export function AbasNivel({ valor, aoMudar }: { valor: NivelDificuldade; aoMudar: (nivel: NivelDificuldade) => void }) {
  return (
    <Abas
      rotulo="Nível de dificuldade"
      valor={valor}
      aoMudar={aoMudar}
      opcoes={[
        { valor: 'facil', rotulo: NOMES_NIVEL.facil, Icone: SignalLow },
        { valor: 'dificil', rotulo: NOMES_NIVEL.dificil, Icone: SignalHigh },
      ]}
    />
  )
}
