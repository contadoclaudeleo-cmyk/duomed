import { GraduationCap, Stethoscope } from 'lucide-react'
import type { ModoEstudo } from '../types'
import { NOMES_MODO } from '../data'

const ICONES = { graduacao: GraduationCap, residencia: Stethoscope }

/** Abas para alternar entre Graduação e Residência */
export function AbasModo({ valor, aoMudar }: { valor: ModoEstudo; aoMudar: (modo: ModoEstudo) => void }) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-2xl border-2 border-borda bg-superficie-2 p-1" role="tablist">
      {(['graduacao', 'residencia'] as const).map((modo) => {
        const Icone = ICONES[modo]
        const ativo = modo === valor
        return (
          <button
            key={modo}
            type="button"
            role="tab"
            aria-selected={ativo}
            onClick={() => aoMudar(modo)}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-extrabold transition-colors ${
              ativo ? 'bg-superficie text-agua-texto shadow-[0_2px_0_0_var(--borda)] dark:text-menta' : 'text-texto-suave'
            }`}
          >
            <Icone className="h-5 w-5" strokeWidth={2.4} aria-hidden />
            {NOMES_MODO[modo]}
          </button>
        )
      })}
    </div>
  )
}
