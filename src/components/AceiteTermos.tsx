import { useState } from 'react'
import { arquivoPublico } from '../lib/caminho'

const classeLink = 'font-bold text-agua-texto underline underline-offset-2 dark:text-menta'

/**
 * Checkboxes do aceite: termos (obrigatório) e marketing (opcional, desmarcado).
 * Usado no cadastro e na tela de termos atualizados.
 */
export function CaixasAceite({
  termos,
  aoMudarTermos,
  marketing,
  aoMudarMarketing,
}: {
  termos: boolean
  aoMudarTermos: (v: boolean) => void
  marketing: boolean
  aoMudarMarketing: (v: boolean) => void
}) {
  return (
    <div className="flex flex-col gap-2.5 text-left text-sm">
      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={termos}
          onChange={(e) => aoMudarTermos(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-agua,#14B8A6)]"
        />
        <span>
          Li e aceito os{' '}
          <a href={arquivoPublico('termos.html')} target="_blank" rel="noreferrer" className={classeLink}>
            Termos de uso
          </a>{' '}
          e a{' '}
          <a href={arquivoPublico('privacidade.html')} target="_blank" rel="noreferrer" className={classeLink}>
            Política de privacidade
          </a>
          .
        </span>
      </label>
      <label className="flex cursor-pointer items-start gap-2.5 text-texto-suave">
        <input
          type="checkbox"
          checked={marketing}
          onChange={(e) => aoMudarMarketing(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-agua,#14B8A6)]"
        />
        <span>Quero receber novidades e dicas de estudo por e-mail (opcional, dá para sair quando quiser).</span>
      </label>
    </div>
  )
}

/** Hook com o estado das duas caixas */
export function useCaixasAceite() {
  const [termos, setTermos] = useState(false)
  const [marketing, setMarketing] = useState(false)
  return { termos, setTermos, marketing, setMarketing }
}
