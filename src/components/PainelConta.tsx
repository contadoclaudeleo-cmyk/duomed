import { useState } from 'react'
import { criarConta, entrarComEmail, entrarComGoogle, useConta } from '../lib/nuvem'
import { Botao } from './Botao'

type Aba = 'entrar' | 'criar'

/** Formulário de conta: Google ou e-mail e senha. Usado nas boas-vindas e no perfil. */
export function PainelConta({ abaInicial = 'criar' }: { abaInicial?: Aba }) {
  const [aba, setAba] = useState<Aba>(abaInicial)
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const erroGoogle = useConta((s) => s.erro)

  async function tentar(acao: () => Promise<unknown>) {
    setErro(null)
    setAviso(null)
    setEnviando(true)
    try {
      await acao()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não deu certo. Tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  function enviarFormulario() {
    if (aba === 'entrar') return tentar(() => entrarComEmail(email, senha))
    return tentar(async () => {
      const entrou = await criarConta(email, senha)
      if (!entrou) setAviso('Enviamos um link para o seu e-mail. Abra o link para ativar a conta.')
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        disabled={enviando}
        onClick={() => tentar(entrarComGoogle)}
        className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border-2 border-borda bg-superficie font-extrabold shadow-[0_4px_0_0_var(--borda)] transition-[transform,box-shadow] duration-75 hover:bg-superficie-2 active:translate-y-1 active:shadow-none disabled:opacity-60"
      >
        <LogoGoogle />
        Continuar com Google
      </button>

      <div className="flex items-center gap-3 text-xs font-bold uppercase text-texto-suave">
        <span className="h-0.5 flex-1 bg-borda" />
        ou com e-mail
        <span className="h-0.5 flex-1 bg-borda" />
      </div>

      <div className="grid grid-cols-2 gap-2" role="tablist">
        {(
          [
            ['criar', 'Criar conta'],
            ['entrar', 'Já tenho conta'],
          ] as const
        ).map(([valor, rotulo]) => (
          <button
            key={valor}
            type="button"
            role="tab"
            aria-selected={aba === valor}
            onClick={() => {
              setAba(valor)
              setErro(null)
              setAviso(null)
            }}
            className={`rounded-xl border-2 px-3 py-2 text-sm font-bold transition-colors ${
              aba === valor
                ? 'border-agua bg-agua/10 text-agua-texto dark:text-menta'
                : 'border-borda text-texto-suave hover:bg-superficie-2'
            }`}
          >
            {rotulo}
          </button>
        ))}
      </div>

      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          enviarFormulario()
        }}
      >
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Seu e-mail"
          aria-label="E-mail"
          className="w-full rounded-2xl border-2 border-borda bg-superficie px-4 py-3.5 font-semibold outline-none transition-colors placeholder:text-apagado-texto focus:border-agua"
        />
        <input
          type="password"
          autoComplete={aba === 'criar' ? 'new-password' : 'current-password'}
          required
          minLength={6}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder={aba === 'criar' ? 'Crie uma senha (mínimo 6 caracteres)' : 'Sua senha'}
          aria-label="Senha"
          className="w-full rounded-2xl border-2 border-borda bg-superficie px-4 py-3.5 font-semibold outline-none transition-colors placeholder:text-apagado-texto focus:border-agua"
        />
        {(erro ?? erroGoogle) && (
          <p role="alert" className="text-sm font-bold text-erro-texto">
            {erro ?? erroGoogle}
          </p>
        )}
        {aviso && <p className="text-sm font-bold text-agua-texto dark:text-menta">{aviso}</p>}
        <Botao type="submit" larguraTotal disabled={enviando}>
          {enviando ? 'Aguarde...' : aba === 'criar' ? 'Criar conta' : 'Entrar'}
        </Botao>
      </form>

      <p className="text-center text-xs text-texto-suave">
        Guardamos só seu e-mail e seu progresso, para você continuar de qualquer aparelho. Você pode apagar a conta
        quando quiser, no perfil.
      </p>
    </div>
  )
}

/** "G" colorido do Google */
function LogoGoogle() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  )
}
