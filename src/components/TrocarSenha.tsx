import { useState } from 'react'
import { Modal } from './Modal'
import { Botao } from './Botao'
import { trocarSenha, useConta } from '../lib/nuvem'

/** Abre sozinha quando a pessoa chega pelo link de "esqueci minha senha" e pede a senha nova */
export function TrocarSenha() {
  const aberto = useConta((s) => s.redefinindo && !!s.sessao)
  const [senha, setSenha] = useState('')
  const [repetir, setRepetir] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function salvar() {
    if (senha.length < 8) return setErro('A senha precisa ter pelo menos 8 caracteres.')
    if (senha !== repetir) return setErro('As duas senhas não estão iguais.')
    setErro(null)
    setEnviando(true)
    try {
      await trocarSenha(senha)
      setSenha('')
      setRepetir('')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não deu certo. Tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  const campo =
    'w-full rounded-2xl border-2 border-borda bg-superficie px-4 py-3.5 font-semibold outline-none transition-colors placeholder:text-apagado-texto focus:border-agua'

  return (
    <Modal aberto={aberto} aoFechar={() => useConta.setState({ redefinindo: false })}>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          salvar()
        }}
      >
        <h2 className="text-xl font-extrabold">Crie sua nova senha</h2>
        <p className="text-sm text-texto-suave">Você entrou pelo link do e-mail. Escolha a senha que vai usar daqui para frente.</p>
        <input
          type="password"
          autoComplete="new-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Nova senha (mínimo 8 caracteres)"
          aria-label="Nova senha"
          className={campo}
        />
        <input
          type="password"
          autoComplete="new-password"
          value={repetir}
          onChange={(e) => setRepetir(e.target.value)}
          placeholder="Repita a nova senha"
          aria-label="Repita a nova senha"
          className={campo}
        />
        {erro && (
          <p role="alert" className="text-sm font-bold text-erro-texto">
            {erro}
          </p>
        )}
        <Botao type="submit" larguraTotal disabled={enviando}>
          {enviando ? 'Aguarde...' : 'Salvar nova senha'}
        </Botao>
      </form>
    </Modal>
  )
}
