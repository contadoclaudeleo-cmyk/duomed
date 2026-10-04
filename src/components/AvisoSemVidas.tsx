import { useNavigate } from 'react-router-dom'
import { useJogo } from '../store/useJogo'
import { useAgora } from '../lib/hooks'
import { tempoParaProximaVida } from '../lib/vidas'
import { formatarDuracao } from '../lib/datas'
import { Botao } from './Botao'
import { Lapio } from './Lapio'

/** Conteúdo mostrado quando as vidas acabam (dentro de um Modal ou em tela cheia) */
export function AvisoSemVidas({ aoVoltar }: { aoVoltar: () => void }) {
  const navegar = useNavigate()
  const vidas = useJogo((s) => s.vidas)
  const ultimaRecarga = useJogo((s) => s.ultimaRecargaVida)
  const agora = useAgora(1000)
  const falta = tempoParaProximaVida({ vidas, ultimaRecarga }, agora)

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <Lapio humor="erro" altura={110} />
      <h2 className="text-2xl font-extrabold">Suas vidas acabaram</h2>
      <p className="text-texto-suave">
        Você ganha uma vida nova a cada 5 minutos. A próxima chega em{' '}
        <strong className="text-texto tabular-nums">{formatarDuracao(falta)}</strong>.
        Enquanto isso, a revisão continua liberada e não gasta vidas.
      </p>
      <div className="mt-2 flex w-full flex-col gap-3">
        <Botao larguraTotal onClick={() => navegar('/loja')}>
          Vidas infinitas com o Plus
        </Botao>
        <Botao larguraTotal variante="contorno" onClick={() => navegar('/revisao', { replace: true })}>
          Revisar sem gastar vidas
        </Botao>
        <Botao larguraTotal variante="contorno" onClick={aoVoltar}>
          Voltar para a trilha
        </Botao>
      </div>
    </div>
  )
}
