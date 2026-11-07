import { Botao } from '../components/Botao'
import { Logo } from '../components/Logo'
import { CaixasAceite, useCaixasAceite } from '../components/AceiteTermos'
import { aceitarTermos } from '../lib/consentimento'
import { sair } from '../lib/nuvem'

/**
 * Aparece para quem entrou (pelo Google ou com conta antiga) sem ter aceitado
 * a versão atual dos termos. Sem aceite, a pessoa só pode sair.
 */
export function TermosAtualizados() {
  const caixas = useCaixasAceite()
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-10">
      <Logo altura={44} />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold">Antes de continuar</h1>
        <p className="text-texto-suave">
          Para usar sua conta, leia e aceite os termos de uso e a política de privacidade do DuoMed.
        </p>
      </div>
      <CaixasAceite
        termos={caixas.termos}
        aoMudarTermos={caixas.setTermos}
        marketing={caixas.marketing}
        aoMudarMarketing={caixas.setMarketing}
      />
      <Botao larguraTotal disabled={!caixas.termos} onClick={() => aceitarTermos(caixas.marketing)}>
        Continuar
      </Botao>
      <button
        type="button"
        onClick={() => void sair()}
        className="mx-auto text-sm font-bold text-texto-suave underline underline-offset-2"
      >
        Não aceito, sair da conta
      </button>
    </main>
  )
}
