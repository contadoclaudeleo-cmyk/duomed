import { Cookie } from 'lucide-react'
import { escolherCookies, useConsentimento } from '../lib/consentimento'
import { arquivoPublico } from '../lib/caminho'

/**
 * Banner de cookies. Aparece até a pessoa escolher (ou quando ela pede no perfil).
 * O essencial (login e progresso no aparelho) sempre funciona.
 * A medição de uso só liga com "Aceitar"; "Recusar" tem o mesmo destaque.
 */
export function BannerCookies() {
  const escolha = useConsentimento((s) => s.cookies)
  const aberto = useConsentimento((s) => s.bannerAberto)
  if (escolha && !aberto) return null

  return (
    <div
      role="dialog"
      aria-label="Cookies e privacidade"
      className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4"
    >
      <div className="mx-auto flex max-w-xl flex-col gap-3 rounded-2xl border-2 border-borda bg-superficie p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <Cookie className="mt-0.5 h-6 w-6 shrink-0 text-agua" strokeWidth={2.4} aria-hidden />
          <p className="text-sm text-texto">
            Usamos o armazenamento do aparelho só para o essencial: manter você conectado e salvar seu progresso. Com
            a sua permissão, também medimos quantas pessoas usam o app por dia. Não usamos anúncios nem rastreadores
            de terceiros.{' '}
            <a
              href={arquivoPublico('privacidade.html#cookies')}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-agua-texto underline underline-offset-2 dark:text-menta"
            >
              Saiba mais
            </a>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => escolherCookies('recusado')}
            className="rounded-xl border-2 border-borda px-3 py-2.5 text-sm font-extrabold hover:bg-superficie-2"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={() => escolherCookies('aceito')}
            className="rounded-xl border-2 border-agua bg-agua px-3 py-2.5 text-sm font-extrabold text-white hover:opacity-90"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  )
}
