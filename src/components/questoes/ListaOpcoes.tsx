import { useEffect, useMemo } from 'react'
import { embaralhar } from '../../lib/embaralhar'
import { Opcao, type EstadoOpcao } from './Opcao'

interface Props {
  /** Usado para embaralhar só uma vez por questão */
  idQuestao: string
  opcoes: string[]
  correta: string
  escolhida: string | null
  verificada: boolean
  aoEscolher: (opcao: string) => void
  emGrade?: boolean
}

/** Lista de alternativas embaralhadas. No computador, as teclas 1 a 4 escolhem a opção. */
export function ListaOpcoes({ idQuestao, opcoes, correta, escolhida, verificada, aoEscolher, emGrade }: Props) {
  const ordem = useMemo(() => embaralhar(opcoes), [idQuestao])

  useEffect(() => {
    if (verificada) return
    const tecla = (e: KeyboardEvent) => {
      const n = Number(e.key)
      if (n >= 1 && n <= ordem.length) aoEscolher(ordem[n - 1])
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [verificada, ordem, aoEscolher])

  function estado(opcao: string): EstadoOpcao {
    if (!verificada) return opcao === escolhida ? 'selecionada' : 'normal'
    if (opcao === correta) return 'certa'
    if (opcao === escolhida) return 'errada'
    return 'apagada'
  }

  return (
    <div className={emGrade ? 'grid grid-cols-1 gap-3 sm:grid-cols-2' : 'flex flex-col gap-3'}>
      {ordem.map((opcao, i) => (
        <Opcao
          key={opcao}
          estado={estado(opcao)}
          desabilitada={verificada}
          atalho={i + 1}
          aoClicar={() => aoEscolher(opcao)}
        >
          {opcao}
        </Opcao>
      ))}
    </div>
  )
}
