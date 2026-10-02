import { CalendarClock, Layers, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useJogo } from '../store/useJogo'
import { MAX_QUESTOES_POR_REVISAO, proximaRevisao, questoesParaRevisar } from '../lib/revisao'
import { quandoRelativo } from '../lib/datas'
import { useAgora } from '../lib/hooks'
import { Botao } from '../components/Botao'
import { Lapio } from '../components/Lapio'

/** Tela de entrada da revisão: mostra a fila e inicia a sessão */
export function Revisao() {
  const navegar = useNavigate()
  const fila = useJogo((s) => s.filaRevisao)
  const agora = useAgora(30_000)
  const pendentes = questoesParaRevisar(fila, agora).length
  const naFila = Object.keys(fila).length
  const proxima = proximaRevisao(fila)

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-8 text-center">
      <Lapio altura={130} />
      <h1 className="mt-4 text-2xl font-extrabold">Revisão</h1>
      <p className="mt-1 max-w-sm text-texto-suave">
        As questões que você errou voltam aqui para fixar o conteúdo. Revisar não gasta vidas.
      </p>

      <div className="mt-6 grid w-full grid-cols-2 gap-3">
        <div className="rounded-2xl border-2 border-borda bg-superficie p-4">
          <RotateCcw className="mx-auto mb-1 h-6 w-6 text-laranja" strokeWidth={2.6} />
          <p className="text-3xl font-extrabold">{pendentes}</p>
          <p className="text-sm font-semibold text-texto-suave">para revisar agora</p>
        </div>
        <div className="rounded-2xl border-2 border-borda bg-superficie p-4">
          <Layers className="mx-auto mb-1 h-6 w-6 text-agua" strokeWidth={2.6} />
          <p className="text-3xl font-extrabold">{naFila}</p>
          <p className="text-sm font-semibold text-texto-suave">na fila no total</p>
        </div>
      </div>

      {pendentes === 0 && proxima && (
        <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-texto-suave">
          <CalendarClock className="h-4 w-4" /> Próxima revisão {quandoRelativo(proxima, agora)}
        </p>
      )}
      {naFila === 0 && (
        <p className="mt-4 text-sm font-semibold text-texto-suave">
          Nada por aqui ainda. Quando você errar uma questão, ela aparece nesta tela.
        </p>
      )}

      <Botao
        className="mt-8 w-full max-w-sm"
        disabled={pendentes === 0}
        onClick={() => navegar('/revisao/praticar')}
      >
        {pendentes > 0 ? textoBotao(Math.min(pendentes, MAX_QUESTOES_POR_REVISAO)) : 'Tudo revisado'}
      </Botao>

      <div className="mt-10 w-full rounded-2xl border-2 border-borda p-4 text-left text-sm text-texto-suave">
        <p className="mb-1 font-extrabold text-texto">Como funciona</p>
        Cada acerto na revisão empurra a questão para mais longe: ela volta depois de 1 dia, depois de 3 dias e
        depois de 7 dias. Acertou de novo, ela sai da fila. Se errar, volta para o começo.
      </div>
    </div>
  )
}

const textoBotao = (n: number) => `Revisar ${n} ${n === 1 ? 'questão' : 'questões'}`
