import { useJogo } from '../store/useJogo'
import { Lapio } from '../components/Lapio'
import { PainelConta } from '../components/PainelConta'

/**
 * Para quem já estudava no aparelho antes da conta ser obrigatória.
 * Ao entrar, o progresso deste aparelho é juntado com o da conta (lib/nuvem.ts).
 */
export function ContaObrigatoria() {
  const nome = useJogo((s) => s.usuario?.nome ?? '')
  const xp = useJogo((s) => s.xpTotal)

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-8 pt-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <Lapio altura={110} />
        <h1 className="text-2xl font-extrabold">{nome ? `Oi, ${nome.split(' ')[0]}!` : 'Oi!'}</h1>
        <p className="text-texto-suave">
          Agora o DuoMed funciona com conta. Crie a sua ou entre para continuar estudando
          {xp > 0 ? `. Seus ${xp} XP e todo o progresso deste aparelho vão junto.` : '.'}
        </p>
      </div>
      <div className="mt-6">
        <PainelConta abaInicial="criar" />
      </div>
    </div>
  )
}
