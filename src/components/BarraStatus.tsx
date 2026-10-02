import { Flame, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useJogo } from '../store/useJogo'
import { buscarMateria } from '../data'
import { ofensivaVigente } from '../lib/ofensiva'
import { chaveDia } from '../lib/datas'
import { ContadorVidas } from './ContadorVidas'
import { IconeMateria } from './IconeMateria'

/** Topo da trilha: matéria atual (toque para trocar), ofensiva, XP e vidas */
export function BarraStatus() {
  const materia = buscarMateria(useJogo((s) => s.materiaAtual))
  const ofensiva = ofensivaVigente(useJogo((s) => s.ofensiva))
  const xpTotal = useJogo((s) => s.xpTotal)
  const meta = useJogo((s) => s.usuario?.metaDiaria ?? 20)
  const xpHoje = useJogo((s) => s.xpPorDia[chaveDia()] ?? 0)
  const metaBatida = xpHoje >= meta

  return (
    <header className="sticky top-0 z-20 border-b-2 border-borda bg-fundo">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-3">
        <Link
          to="/materias"
          className="flex items-center gap-2 rounded-xl border-2 border-borda px-2.5 py-1.5 font-bold transition-colors hover:bg-superficie-2"
          aria-label={`Matéria atual: ${materia?.nome}. Trocar matéria`}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-agua text-white">
            <IconeMateria nome={materia?.icone ?? ''} className="h-4 w-4" />
          </span>
          <span className="text-sm">{materia?.nome}</span>
        </Link>

        <div className="flex items-center gap-4">
          <span
            className={`flex items-center gap-1 font-extrabold ${metaBatida ? 'text-laranja' : 'text-apagado-texto'}`}
            title="Ofensiva: dias seguidos batendo a meta"
            aria-label={`Ofensiva de ${ofensiva} dias`}
          >
            <Flame className="h-6 w-6" fill="currentColor" strokeWidth={1.5} />
            {ofensiva}
          </span>
          <span className="flex items-center gap-1 font-extrabold text-laranja-escura dark:text-laranja" aria-label={`${xpTotal} XP`}>
            <Zap className="h-6 w-6" fill="currentColor" strokeWidth={1.5} />
            {xpTotal}
          </span>
          <ContadorVidas />
        </div>
      </div>
    </header>
  )
}
