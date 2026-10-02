import { House, RotateCcw, Trophy, UserRound, type LucideIcon } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useJogo } from '../store/useJogo'
import { questoesParaRevisar } from '../lib/revisao'
import { useAgora } from '../lib/hooks'
import { Logo } from './Logo'

interface ItemNav {
  para: string
  rotulo: string
  Icone: LucideIcon
}

const ITENS: ItemNav[] = [
  { para: '/', rotulo: 'Trilha', Icone: House },
  { para: '/revisao', rotulo: 'Revisão', Icone: RotateCcw },
  { para: '/ranking', rotulo: 'Ranking', Icone: Trophy },
  { para: '/perfil', rotulo: 'Perfil', Icone: UserRound },
]

/** Estrutura das telas principais: navegação embaixo (celular) ou na lateral (computador) */
export function Layout() {
  const fila = useJogo((s) => s.filaRevisao)
  const agora = useAgora(30_000)
  const pendentes = questoesParaRevisar(fila, agora).length

  return (
    <div className="min-h-dvh md:flex">
      {/* Lateral no computador */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-2 border-r-2 border-borda px-4 py-6 md:flex">
        <Logo altura={56} className="mb-6 px-1" />
        {ITENS.map((item) => (
          <LinkNav key={item.para} item={item} contador={item.para === '/revisao' ? pendentes : 0} lateral />
        ))}
      </aside>

      <main className="min-w-0 flex-1 pb-24 md:pb-10">
        <Outlet />
      </main>

      {/* Barra inferior no celular */}
      <nav className="pb-seguro fixed inset-x-0 bottom-0 z-30 border-t-2 border-borda bg-fundo md:hidden">
        <div className="mx-auto flex max-w-md justify-around px-2 py-1.5">
          {ITENS.map((item) => (
            <LinkNav key={item.para} item={item} contador={item.para === '/revisao' ? pendentes : 0} />
          ))}
        </div>
      </nav>
    </div>
  )
}

function LinkNav({ item, contador, lateral }: { item: ItemNav; contador: number; lateral?: boolean }) {
  const { para, rotulo, Icone } = item
  return (
    <NavLink
      to={para}
      end={para === '/'}
      className={({ isActive }) =>
        `relative flex items-center rounded-xl border-2 font-bold transition-colors ${
          lateral ? 'gap-4 px-3 py-2.5 text-sm uppercase tracking-wide' : 'flex-col gap-0.5 px-3 py-1.5 text-[11px]'
        } ${
          isActive
            ? 'border-agua/40 bg-agua/10 text-agua-texto dark:text-menta'
            : 'border-transparent text-texto-suave hover:bg-superficie-2'
        }`
      }
    >
      <span className="relative">
        <Icone className={lateral ? 'h-6 w-6' : 'h-6 w-6'} strokeWidth={2.4} aria-hidden />
        {contador > 0 && (
          <span className="absolute -right-2.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-laranja px-1 text-[10px] font-extrabold text-white">
            {contador > 9 ? '9+' : contador}
          </span>
        )}
      </span>
      {rotulo}
    </NavLink>
  )
}
