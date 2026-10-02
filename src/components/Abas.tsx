import type { LucideIcon } from 'lucide-react'

interface Opcao<T extends string> {
  valor: T
  rotulo: string
  Icone: LucideIcon
}

/** Abas lado a lado para escolher uma opção (modo de estudo, nível etc.) */
export function Abas<T extends string>({
  valor,
  opcoes,
  aoMudar,
  rotulo,
}: {
  valor: T
  opcoes: Opcao<T>[]
  aoMudar: (valor: T) => void
  rotulo: string
}) {
  return (
    <div
      className="grid gap-1 rounded-2xl border-2 border-borda bg-superficie-2 p-1"
      style={{ gridTemplateColumns: `repeat(${opcoes.length}, minmax(0, 1fr))` }}
      role="tablist"
      aria-label={rotulo}
    >
      {opcoes.map(({ valor: v, rotulo: r, Icone }) => {
        const ativo = v === valor
        return (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={ativo}
            onClick={() => aoMudar(v)}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-extrabold transition-colors ${
              ativo ? 'bg-superficie text-agua-texto shadow-[0_2px_0_0_var(--borda)] dark:text-menta' : 'text-texto-suave'
            }`}
          >
            <Icone className="h-5 w-5" strokeWidth={2.4} aria-hidden />
            {r}
          </button>
        )
      })}
    </div>
  )
}
