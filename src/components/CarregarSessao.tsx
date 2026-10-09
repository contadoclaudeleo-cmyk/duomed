import { Loader2 } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { FalhaEstudo, mensagemDoErro, type SessaoServidor } from '../lib/estudo'
import { AvisoSemVidas } from './AvisoSemVidas'
import { Botao } from './Botao'
import { Lapio } from './Lapio'

interface Props {
  /** Pede a sessão ao servidor (chamado uma vez, ao abrir a tela) */
  abrir: () => Promise<SessaoServidor>
  /** Para onde vai o botão "Voltar" se der erro */
  voltarPara?: string
  children: (sessao: SessaoServidor) => ReactNode
}

/** Busca as questões no servidor e mostra "carregando", o erro ou a sessão */
export function CarregarSessao({ abrir, voltarPara = '/', children }: Props) {
  const navegar = useNavigate()
  const [sessao, setSessao] = useState<SessaoServidor | null>(null)
  const [erro, setErro] = useState<unknown>(null)
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let ativo = true
    setErro(null)
    abrir().then(
      (s) => ativo && setSessao(s),
      (e) => ativo && setErro(e),
    )
    return () => {
      ativo = false
    }
    // Só abre de novo quando a pessoa pede "Tentar de novo"
  }, [tentativa])

  const voltar = () => navegar(voltarPara, { replace: true })

  if (sessao) return <>{children(sessao)}</>

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      {erro instanceof FalhaEstudo && erro.codigo === 'sem_vidas' ? (
        <AvisoSemVidas aoVoltar={voltar} />
      ) : erro ? (
        <>
          <Lapio humor="erro" altura={100} />
          <p className="font-bold">{mensagemDoErro(erro)}</p>
          <Botao larguraTotal onClick={() => setTentativa((t) => t + 1)}>
            Tentar de novo
          </Botao>
          <Botao larguraTotal variante="contorno" onClick={voltar}>
            Voltar
          </Botao>
        </>
      ) : (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-agua" strokeWidth={2.6} aria-hidden />
          <p className="font-bold text-texto-suave">Carregando as questões...</p>
        </>
      )}
    </div>
  )
}
